/**
 * Campaign service for email processing
 */

import { v4 as uuidv4 } from "uuid";
import { prisma } from "./prisma.service.js";
import { log } from "../utils/logger.js";
import type { EmailRecord, PitchRecord } from "../models/email.js";

/**
 * Fetches campaign emails in batches to prevent query string too large errors.
 * @param emailIds - List of email IDs.
 * @param chunkSize - Number of emails per request batch (default: 50).
 * @returns Flattened array of campaign email records.
 */
export async function fetchCampaignEmails(
  emailIds: string[],
  chunkSize = 50,
): Promise<EmailRecord[]> {
  const txId = uuidv4().substring(0, 8);
  log("INFO", `Fetching campaign emails in chunks`, txId, {
    totalEmails: emailIds.length,
    chunkSize,
  });

  const chunkedRequests = [];

  for (let i = 0; i < emailIds.length; i += chunkSize) {
    const chunk = emailIds.slice(i, i + chunkSize);

    log(
      "INFO",
      `Fetching chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(
        emailIds.length / chunkSize,
      )}`,
      txId,
      {
        chunkSize: chunk.length,
      },
    );

    chunkedRequests.push(
      prisma.campaignEmail.findMany({
        where: { id: { in: chunk } },
        include: {
          campaign: {
            include: {
              user: true,
              campaignEmailCredentials: {
                include: { emailCredential: true },
              },
            },
          },
        },
      }),
    );
  }

  try {
    const results = await Promise.all(chunkedRequests);
    const flattened = results.flat();

    log(
      "INFO",
      `Successfully fetched ${flattened.length} campaign emails`,
      txId,
    );
    return flattened;
  } catch (error: any) {
    log("ERROR", `Error fetching campaign emails`, txId, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Fetches the pitch for an email's campaign and stage.
 * @param email - Email object from campaign.
 * @returns Pitch object or null if not found.
 */
export async function fetchPitch(
  email: EmailRecord,
): Promise<PitchRecord | null> {
  const txId = uuidv4().substring(0, 8);

  log(
    "INFO",
    `Fetching pitch for campaign ${email.campaign} stage ${email.stage}`,
    txId,
  );

  try {
    const result = await prisma.pitchEmail.findFirst({
      where: {
        stage: email.stage,
        campaignId: email.campaign,
      },
    });

    if (!result) {
      log(
        "WARN",
        `No pitch found for campaign ${email.campaign} stage ${email.stage}`,
        txId,
      );
      return null;
    }

    log("INFO", `Found pitch ${result.id}`, txId);
    return result as unknown as PitchRecord;
  } catch (error: any) {
    log("ERROR", `Error fetching pitch`, txId, {
      error: error.message,
      stack: error.stack,
      campaignId: email.campaign,
      stage: email.stage,
    });
    return null;
  }
}

/**
 * Updates the email status after sending.
 * @param email - Email object.
 */
export async function updateEmailStatus(email: EmailRecord): Promise<void> {
  const txId = uuidv4().substring(0, 8);

  try {
    const user = email.campaign?.user;

    if (user && user.id) {
      log("INFO", `Updating user credits`, txId, { userId: user.id });
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      });
    }

    const nextStage = email.stage + 1;
    const maxStage = email.campaign?.maxStageCount || 1;
    const nextStatus = email.stage === maxStage - 1 ? "COMPLETED" : "RUNNING";

    log("INFO", `Updating email status`, txId, {
      emailId: email.id,
      currentStage: email.stage,
      nextStage,
      nextStatus,
      maxStage,
    });

    await prisma.campaignEmail.update({
      where: { id: email.id },
      data: {
        status: nextStatus,
        stage: nextStage,
        sentAt: new Date(),
      },
    });

    log("INFO", `Email status updated successfully`, txId, {
      emailId: email.id,
      status: nextStatus,
      stage: nextStage,
    });
  } catch (error: any) {
    log("ERROR", `Error updating email status`, txId, {
      error: error.message,
      stack: error.stack,
      emailId: email.id,
    });
    throw error;
  }
}

/**
 * Creates a campaign message record after sending an email.
 * @param email - Email object.
 * @param pitch - Pitch object.
 * @param messageId - Message ID from the sent email.
 * @param body - Email body content.
 * @param txId - Transaction ID for logging.
 */
export async function createCampaignMessage(
  email: EmailRecord,
  pitch: PitchRecord,
  messageId: string,
  body: string,
  txId: string,
): Promise<void> {
  log("INFO", `Creating campaign message record`, txId);

  try {
    await prisma.campaignMessage.create({
      data: {
        sent: true,
        text: body,
        pitchId: pitch.id,
        messageId: messageId,
        campaignEmailId: email.id,
      },
    });

    log("INFO", `Campaign message record created successfully`, txId);
  } catch (error: any) {
    log("ERROR", `Error creating campaign message record`, txId, {
      error: error.message,
      stack: error.stack,
      emailId: email.id,
    });
    throw error;
  }
}
