/**
 * Service for email tracking functionality
 */

import { v4 as uuidv4 } from "uuid";
import { prisma } from "./prisma.service.js";
import { log } from "../utils/logger.js";

/**
 * Tracks an email open event
 * @param emailId - ID of the email that was opened
 * @param ip - IP address of the opener
 * @param userAgent - User agent of the opener
 * @param txId - Transaction ID for logging
 */
export async function trackEmailOpen(
  emailId: string,
  ip: string,
  userAgent: string,
  txId = uuidv4().substring(0, 8),
): Promise<void> {
  try {
    // Get the email record
    const email = await prisma.campaignEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      log("WARN", `Email not found: ${emailId}`, txId);
      return;
    }

    log("INFO", `Tracking open for email: ${emailId}`, txId);

    // Create a record of the open event
    await prisma.campaignOpen.create({
      data: { campaignEmailId: emailId },
    });

    // Increment the opened count on the email
    await prisma.campaignEmail.update({
      where: { id: emailId },
      data: { opened: { increment: 1 } },
    });

    log("INFO", `Successfully tracked open for email: ${emailId}`, txId);
  } catch (error: any) {
    log("ERROR", `Error tracking email open`, txId, {
      emailId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Gets email open statistics for a campaign
 * @param campaignId - ID of the campaign
 * @returns Open statistics
 */
export async function getEmailOpenStats(campaignId: string): Promise<any> {
  const txId = uuidv4().substring(0, 8);

  try {
    // Get all emails for this campaign
    const emails = await prisma.campaignEmail.findMany({
      where: { campaignId: campaignId },
    });

    // Get open counts
    const totalEmails = emails.length;
    const openedEmails = emails.filter(
      (email) => email.opened && email.opened > 0,
    ).length;
    const openRate = totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0;

    log("INFO", `Retrieved open stats for campaign: ${campaignId}`, txId, {
      totalEmails,
      openedEmails,
      openRate: `${openRate.toFixed(2)}%`,
    });

    return {
      totalEmails,
      openedEmails,
      openRate: Number.parseFloat(openRate.toFixed(2)),
    };
  } catch (error: any) {
    log("ERROR", `Error getting email open stats`, txId, {
      campaignId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
