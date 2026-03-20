import { Queue } from "bullmq"
import { redis } from "../config/redis.js"
import { log } from "../utils/logger.js"

// Create a queue for batch email processing
const batchEmailQueue = new Queue("batchEmailQueue", { connection: redis })

// Set to track enqueued email IDs
const enqueuedEmailIds = new Set<string>()

/**
 * Enqueues batches of emails for processing
 * @param emailIds - Array of email IDs to process
 * @returns Array of job IDs
 */
export async function enqueueEmailBatches(emailIds: string[]): Promise<string[]> {
  const batchSize = 50 // Process emails in batches of 50
  const jobIds: string[] = []

  // Process emails in batches
  for (let i = 0; i < emailIds.length; i += batchSize) {
    const batch = emailIds.slice(i, i + batchSize)

    const job = await batchEmailQueue.add(
      "process-emails",
      { emailIds: batch },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 60000, // 1 minute
        },
        removeOnComplete: true,
        removeOnFail: 1000, // Keep the last 1000 failed jobs
      },
    )

    // Add the email IDs to the tracking set
    batch.forEach((id) => enqueuedEmailIds.add(id))

    jobIds.push(job.id)
    log("INFO", `Enqueued batch of ${batch.length} emails`, job.id)
  }

  return jobIds
}

/**
 * Gets the set of currently enqueued email IDs
 * @returns Set of enqueued email IDs
 */
export async function getEnqueuedEmailIds(): Promise<Set<string>> {
  // In a production environment, you might want to store this in Redis
  // instead of in-memory to handle multiple instances
  return enqueuedEmailIds
}

/**
 * Removes email IDs from the enqueued set
 * @param emailIds - Array of email IDs to remove
 */
export function removeEnqueuedEmailIds(emailIds: string[]): void {
  emailIds.forEach((id) => enqueuedEmailIds.delete(id))
}
