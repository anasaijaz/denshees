import { DateTime } from "luxon";
import { prisma } from "../services/prisma.service.js";
import {
  enqueueEmailBatches,
  getEnqueuedEmailIds,
} from "../queues/batch-email.queue.js";

/**
 * Processes the campaign job by fetching campaigns and their emails,
 * filtering based on delivery time, credits, and send delay, then enqueues email batches.
 * @returns {Promise<Array>} List of processed email IDs or an empty array on error.
 */
async function processCampaignJob() {
  try {
    // Fetch all non-deleted campaigns with a user
    const campaigns = await prisma.campaign.findMany({
      where: {
        deleted: false,
        userId: { not: null },
      },
      include: { user: true },
    });

    if (campaigns.length === 0) {
      console.log("No campaigns found.");
      return [];
    }

    // Filter campaigns based on delivery period and available credits
    const validCampaigns = campaigns.filter(passesDeliveryAndCreditCheck);

    // Extract campaign IDs from valid campaigns
    const campaignIds = validCampaigns.map((c: any) => c.id);
    if (campaignIds.length === 0) {
      console.log(
        "No valid campaigns found based on delivery time and credits.",
      );
      return [];
    }

    // Fetch all emails belonging to valid campaigns with RUNNING status,
    // where email status is PENDING or RUNNING (excluding REPLIED and BOUNCED)
    const campaignEmails = await prisma.campaignEmail.findMany({
      where: {
        campaignId: { in: campaignIds },
        campaign: { status: "RUNNING" },
        status: { in: ["PENDING", "RUNNING"] },
        NOT: [{ status: "REPLIED" }, { status: "BOUNCED" }],
      },
      include: { campaign: true },
      orderBy: { stage: "asc" },
    });

    // Filter emails based on the send delay (if any)
    // Stage 0 (fresh leads) should always be sent immediately, regardless of sent_at
    const validEmails = campaignEmails.filter(
      (email: any) =>
        email.stage === 0 ||
        shouldSendToday(
          email.sentAt?.toISOString() ?? null,
          email.campaign?.daysInterval ?? 0,
        ),
    );

    let emailIds = validEmails.map((email: any) => email.id);
    if (emailIds.length === 0) {
      console.log("No valid emails to process.");
      return [];
    }

    // Fetch enqueued email IDs
    const alreadyEnqueuedIds = await getEnqueuedEmailIds();
    emailIds = emailIds.filter((id: any) => !alreadyEnqueuedIds.has(id));

    if (emailIds.length === 0) {
      console.log("No new emails to enqueue (all are already queued).");
      return [];
    }

    console.log("Enqueuing email IDs:", emailIds);
    await enqueueEmailBatches(emailIds);

    return emailIds;
  } catch (error) {
    console.error("Error processing campaign job:", error);
    return [];
  }
}

/**
 * Checks if a campaign is active on the current day based on active_days array.
 * @param {Object} campaign - Campaign object with active_days array.
 * @param {DateTime} currentTime - Current time in the campaign's timezone.
 * @returns {boolean} True if the campaign is active today, false otherwise.
 */
function isCampaignActiveToday(campaign: any, currentTime: DateTime) {
  // If no activeDays specified, assume the campaign is always active
  const activeDays = campaign.activeDays;
  if (!activeDays || !Array.isArray(activeDays) || activeDays.length === 0) {
    return true;
  }

  // Get the current day name in lowercase
  // Luxon weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday
  const dayNames = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const currentDayName = dayNames[currentTime.weekday - 1]; // Convert to 0-based index

  // Check if the current day is in the activeDays array (case-insensitive)
  const activeDaysLowercase = activeDays.map((day: string) =>
    day.toLowerCase(),
  );
  return activeDaysLowercase.includes(currentDayName);
}

/**
 * Checks if a campaign passes the delivery time and credit requirements.
 * @param {Object} campaign - Campaign object.
 * @returns {boolean} True if the campaign meets the criteria, false otherwise.
 */
function passesDeliveryAndCreditCheck(campaign: any) {
  try {
    if (
      !campaign ||
      !campaign.user?.timezone ||
      !campaign.emailDeliveryPeriod
    ) {
      return false;
    }

    // Use Luxon to get the current time in the campaign's timezone
    const currentTime = DateTime.now().setZone(campaign.user.timezone);
    const withinPeriod = isWithinDeliveryPeriod(
      currentTime,
      campaign.emailDeliveryPeriod,
    );

    // Check if the campaign's associated user has available credits.
    const availableCredits = (campaign.user?.credits ?? 0) > 0;

    // Check if today is an active day for the campaign
    const isActiveDay = isCampaignActiveToday(campaign, currentTime);

    return withinPeriod && availableCredits && isActiveDay;
  } catch (error) {
    console.error(`Error checking campaign ${campaign?.id}:`, error);
    return false;
  }
}

/**
 * Determines whether the current time falls within the specified delivery period.
 * @param {DateTime} currentTime - The current time as a Luxon DateTime.
 * @param {string} deliveryPeriod - Delivery period name (e.g., "MORNING", "EVENING").
 * @returns {boolean} True if within the period, false otherwise.
 */
function isWithinDeliveryPeriod(currentTime: DateTime, deliveryPeriod: string) {
  // Ensure deliveryPeriod is a string; if not, log and return false.
  if (typeof deliveryPeriod !== "string") {
    console.warn(`Invalid delivery period: ${deliveryPeriod}`);
    return false;
  }

  const periods: Record<string, { start: number; end: number }> = {
    MORNING: { start: 6, end: 12 }, // 6 AM - 12 PM
    EVENING: { start: 12, end: 18 }, // 12 PM - 6 PM
    NIGHT: { start: 18, end: 24 }, // 6 PM - 12 AM
    MIDNIGHT: { start: 0, end: 6 }, // 12 AM - 6 AM
  };

  const periodKey = deliveryPeriod.toUpperCase();
  const period = periods[periodKey];

  if (!period) {
    console.warn(`Unrecognized delivery period: ${deliveryPeriod}`);
    return false;
  }

  const currentHour = currentTime.hour;
  return currentHour >= period.start && currentHour < period.end;
}

/**
 * Determines if an email should be sent today based on its last sent date and delay.
 * @param {string|null} sentAt - ISO date string of when the email was last sent.
 * @param {number} delay - Minimum number of days between sends.
 * @returns {boolean} True if the email should be sent, false otherwise.
 */
function shouldSendToday(sentAt: string | null, delay: number) {
  // If no sent date is available, send immediately.
  if (!sentAt) return true;
  try {
    return daysPassed(sentAt) >= delay;
  } catch (error) {
    console.error("Error determining if email should be sent today:", error);
    return false;
  }
}

/**
 * Calculates the number of days that have passed since the given ISO date.
 * @param {string} isoDateString - ISO formatted date string.
 * @returns {number} Number of full days passed.
 * @throws Will throw an error if the date format is invalid.
 */
function daysPassed(isoDateString: string) {
  const pastDate = new Date(isoDateString);
  if (isNaN(pastDate.getTime())) {
    throw new Error(`Invalid date format: ${isoDateString}`);
  }

  // Normalize dates to midnight for an accurate day count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  pastDate.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((today.getTime() - pastDate.getTime()) / msPerDay);
}

export { processCampaignJob };
