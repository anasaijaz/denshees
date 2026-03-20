/**
 * Email service for sending campaign emails
 */

import { v4 as uuidv4 } from "uuid";
import { prisma } from "./prisma.service.js";
import { log } from "../utils/logger.js";
import { isValidEmail, applyHoganPersonalization } from "../utils/helpers.js";
import { getEmailTransporter } from "../utils/credential-service.js";
import {
  fetchPitch,
  updateEmailStatus,
  createCampaignMessage,
} from "./campaign-service.js";
import type { EmailRecord } from "../models/email.js";
import { getCredentialSentCount } from "./credential-service.js";
import { htmlToText } from "html-to-text";

/**
 * Fetches threading information for an email
 * @param emailId - ID of the email
 * @param txId - Transaction ID for logging
 * @returns Threading information or null if not found
 */
async function getThreadingInfo(
  emailId: string,
  txId: string,
): Promise<{ replyTo: string; references: string[] } | null> {
  try {
    // Query campaign messages for threading information
    const threadInfo = await prisma.campaignMessage.findFirst({
      where: { campaignEmailId: emailId },
      orderBy: { created: "desc" },
    });

    if (!threadInfo) {
      log("INFO", `No threading information found for email ${emailId}`, txId);
      return null;
    }

    // Extract reply_to and build references from previous messages
    const replyTo = threadInfo.messageId;
    const allMessages = await prisma.campaignMessage.findMany({
      where: { campaignEmailId: emailId },
      orderBy: { created: "asc" },
      select: { messageId: true },
    });
    const references = allMessages
      .map((m) => m.messageId)
      .filter((id): id is string => !!id);

    log("INFO", `Found threading information for email ${emailId}`, txId, {
      replyTo: replyTo || "none",
      referenceCount: references.length,
    });

    return {
      replyTo,
      references,
    };
  } catch (error: any) {
    // If the record doesn't exist or there's an error, return null
    log(
      "WARN",
      `Error fetching threading information for email ${emailId}`,
      txId,
      {
        error: error.message,
      },
    );
    return null;
  }
}

/**
 * Sends an individual campaign email.
 * @param email - Email object from campaign.
 * @param txId - Transaction ID for logging
 */
export async function sendCampaignEmail(
  email: EmailRecord,
  txId = uuidv4().substring(0, 8),
): Promise<void> {
  const startTime = Date.now();

  // Mask email for logging
  const maskedEmail = email.email
    ? email.email.substring(0, 3) + "***@" + email.email.split("@")[1]
    : null;

  log("INFO", `Starting to send campaign email`, txId, {
    emailId: email.id,
    campaign: email.campaign,
    stage: email.stage,
    to: maskedEmail,
  });

  try {
    // Validate recipient email address
    if (!email.email || !isValidEmail(email.email)) {
      log("ERROR", `Invalid or missing recipient email address`, txId, {
        emailId: email.id,
        to: email.email,
      });

      await prisma.campaignEmail.update({
        where: { id: email.id },
        data: { status: "FAILED" },
      });
      return;
    }

    log(
      "INFO",
      `Fetching pitch for campaign ${email.campaign} stage ${email.stage}`,
      txId,
    );
    const pitch = await fetchPitch(email);

    if (!pitch) {
      log(
        "WARN",
        `No pitch found for campaign ${email.campaign} at stage ${email.stage}`,
        txId,
      );
      await prisma.campaignEmail.update({
        where: { id: email.id },
        data: { status: "FAILED" },
      });
      return;
    }

    log("INFO", `Pitch found: ${pitch.id}`, txId);

    // Retrieve the list of available email credentials from the campaign
    const campaignCreds = (email as any).campaign?.campaignEmailCredentials;
    const allCreds =
      campaignCreds?.map((cec: any) => cec.emailCredential).filter(Boolean) ??
      [];
    if (!allCreds || !allCreds.length) {
      log("ERROR", `No email credentials available for campaign`, txId, {
        campaignId: email.campaign,
      });

      await prisma.campaignEmail.update({
        where: { id: email.id },
        data: { status: "FAILED" },
      });
      return;
    }

    log("INFO", `Found ${allCreds.length} credentials for campaign`, txId);

    let credential;
    if (email.stage === 0) {
      // For the first email, choose a random credential that hasn't reached its daily limit
      const availableCreds = [];

      for (const cred of allCreds) {
        const sentCount = await getCredentialSentCount(cred.id);
        if (sentCount < (cred.dailyLimit || 20)) {
          availableCreds.push(cred);
        }
      }

      if (availableCreds.length === 0) {
        log("ERROR", `All email credentials have reached daily limit`, txId, {
          emailId: email.id,
          campaignId: email.campaign,
        });
        return;
      }

      log("INFO", `Found ${availableCreds.length} available credentials`, txId);

      credential =
        availableCreds[Math.floor(Math.random() * availableCreds.length)];
      log("INFO", `Selected credential for initial email`, txId, {
        credentialId: credential.id,
        emailProvider: credential.host,
      });

      // Save the chosen credential's id in the campaigns_email record for follow-ups
      log("INFO", `Saving selected credential to email record`, txId);
      await prisma.campaignEmail.update({
        where: { id: email.id },
        data: { credId: credential.id },
      });
    } else {
      // For follow-up emails (stage > 0), use the previously saved credential
      const savedCredentialId = email.cred;
      if (!savedCredentialId) {
        log(
          "ERROR",
          `No saved credential found in campaign email for stage > 0`,
          txId,
          {
            emailId: email.id,
          },
        );

        await prisma.campaignEmail.update({
          where: { id: email.id },
          data: { status: "FAILED" },
        });
        return;
      }

      log(
        "INFO",
        `Using saved credential ${savedCredentialId} for follow-up email`,
        txId,
      );
      credential = allCreds.find((cred) => cred.id === savedCredentialId);

      if (!credential) {
        log("ERROR", `Saved credential not found in campaign emails`, txId, {
          emailId: email.id,
          credentialId: savedCredentialId,
        });

        await prisma.campaignEmail.update({
          where: { id: email.id },
          data: { status: "FAILED" },
        });
        return;
      }

      // Check if credential has reached its daily limit
      const sentCount = await getCredentialSentCount(credential.id);
      if (sentCount >= (credential.dailyLimit || 30)) {
        log("ERROR", `Daily limit reached for credential`, txId, {
          credentialId: credential.id,
          emailId: email.id,
          sentCount,
          limit: credential.dailyLimit || 30,
        });
        return;
      }
    }

    // Validate sender credentials
    if (!credential || !credential.username || !credential.password) {
      log("ERROR", `Invalid or incomplete credential`, txId, {
        emailId: email.id,
        credentialId: credential?.id,
      });

      await prisma.campaignEmail.update({
        where: { id: email.id },
        data: { status: "FAILED" },
      });
      return;
    }

    // Get the transporter using the credential's id
    log(
      "INFO",
      `Getting email transporter for credential ${credential.id}`,
      txId,
    );
    const transporter = getEmailTransporter(credential.id);

    if (!transporter) {
      log("ERROR", `No transporter found for credential`, txId, {
        credentialId: credential.id,
      });
      return;
    }

    log("INFO", `Personalization`, txId, {
      personalizationData: email.personalization,
      type: typeof email.personalization,
      name: email.name,
      email: email.email,
    });

    const personalizationData = {
      name: email.name || "there",
      email: email.email, // Recipient's email address (stored in "email")
      ...(typeof email.personalization === "string"
        ? JSON.parse(email.personalization || "{}")
        : email.personalization || {}),
    };

    log("INFO", `Applying personalization to email template`, txId);
    const { subject, body } = applyHoganPersonalization(
      pitch,
      personalizationData,
    );

    log("INFO", `Personalization applied successfully`, txId, {
      subjectLength: subject.length,
      bodyLength: body.length,
    });

    // Check if tracking is enabled for this campaign
    const isTrackingEnabled = email.campaign?.isTrackingEnabled === true;
    log(
      "INFO",
      `Email tracking ${
        isTrackingEnabled ? "enabled" : "disabled"
      } for campaign`,
      txId,
      {
        campaignId: email.campaign,
      },
    );

    let processedBody = body;

    // Add tracking pixel only if tracking is enabled
    if (isTrackingEnabled) {
      const trackingUrl = `https://backend.denshees.com/tracking/open?id=${email.id}`;
      const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;

      // Add the tracking pixel at the end of the email body
      processedBody = body + trackingPixel;
    }

    // Double-check recipient email before sending
    if (!email.email || !isValidEmail(email.email)) {
      log("ERROR", `Invalid recipient email address`, txId, {
        emailId: email.id,
        to: email.email,
      });

      await prisma.campaignEmail.update({
        where: { id: email.id },
        data: { status: "FAILED" },
      });
      return;
    }

    // Set up mail options
    const mailOptions = {
      from: credential.username, // Sender is the chosen credential's username
      to: email.email.trim(), // Trim to remove any whitespace
      subject,
      html: processedBody,
      text: htmlToText(processedBody, {
        wordwrap: 130,
        selectors: [
          { selector: "img", format: "skip" }, // ignore images
          { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
        ],
      }),
      // Add headers for tracking
      // headers: {
      //   "X-Transaction-ID": txId,
      //   "X-Campaign-ID": email.campaign,
      //   "X-Email-ID": email.id,
      // },
    };

    // For follow-up emails (stage > 0), set up threading headers
    if (email.stage > 0) {
      log(
        "INFO",
        `Setting up email threading for follow-up email (stage ${email.stage})`,
        txId,
      );

      // Get threading information from the view
      const threadingInfo = await getThreadingInfo(email.id, txId);

      if (threadingInfo && threadingInfo.replyTo) {
        log("INFO", `Adding threading headers`, txId, {
          inReplyTo: threadingInfo.replyTo,
          referenceCount: threadingInfo.references.length,
        });

        mailOptions.inReplyTo = threadingInfo.replyTo;
        mailOptions.references = threadingInfo.references;

        // Add "Re:" prefix to subject if not already present
        // if (!subject.startsWith("Re:")) {
        //   mailOptions.subject = `Re: ${subject}`;
        // }
      } else {
        log(
          "WARN",
          `No threading information available for follow-up email`,
          txId,
        );
      }
    }

    // Log the mail options for debugging (excluding sensitive content)
    log("INFO", `Sending email`, txId, {
      from: credential.username,
      to: maskedEmail,
      subject: mailOptions.subject,
      isThreaded: email.stage > 0 && {
        inReplyTo: mailOptions.replyTo,
        references: mailOptions.references,
      },
    });

    try {
      log("INFO", `Calling nodemailer sendMail`, txId);
      const sendStartTime = Date.now();
      const { messageId } = await transporter.sendMail(mailOptions);
      const sendDuration = Date.now() - sendStartTime;

      log("INFO", `Email sent successfully`, txId, {
        messageId,
        sendDuration: `${sendDuration}ms`,
      });

      log("INFO", `Updating email status`, txId);
      await updateEmailStatus(email);

      // Create campaign message record
      await createCampaignMessage(email, pitch, messageId, body, txId);

      log("INFO", `Email processing completed successfully`, txId, {
        duration: `${Date.now() - startTime}ms`,
      });
    } catch (error: any) {
      // Check for rate limiting errors
      if (
        error.code === "EAUTH" &&
        (error.responseCode === 454 || error.responseCode === 421) &&
        (error.response.includes("Too many login attempts") ||
          error.response.includes("rate limit"))
      ) {
        log(
          "WARN",
          `Rate limit hit for credential. Email will be retried later with a different credential.`,
          txId,
          {
            credentialId: credential.id,
            errorCode: error.code,
            responseCode: error.responseCode,
            response: error.response,
          },
        );

        // Don't update the email status so it can be retried later
      } else if (error.code === "EENVELOPE") {
        // Handle recipient errors
        log("ERROR", `Recipient error for email`, txId, {
          emailId: email.id,
          to: email.email,
          errorCode: error.code,
          errorMessage: error.message,
        });

        await prisma.campaignEmail.update({
          where: { id: email.id },
          data: { status: "FAILED" },
        });
      } else {
        log("ERROR", `Error sending email`, txId, {
          error: error.message,
          stack: error.stack,
          emailId: email.id,
          credentialId: credential.id,
        });

        // For other errors, mark as failed but allow retry
        await prisma.campaignEmail.update({
          where: { id: email.id },
          data: { status: "FAILED" },
        });
      }
    }
  } catch (error: any) {
    log("ERROR", `Unexpected error in sendCampaignEmail`, txId, {
      error: error.message,
      stack: error.stack,
      emailId: email.id,
    });
  }
}
