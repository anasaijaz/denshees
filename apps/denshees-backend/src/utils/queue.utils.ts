/**
 * Queue utilities for email processing
 */

import { Queue } from "bullmq"
import { redis } from "../config/redis.js"
import { log } from "./logger.js"

// Create a queue for batch email processing
export const batchEmailQueue = new Queue("batchEmailQueue", { connection: redis })

/**
 * Adds a batch of email IDs to the processing queue
 * @param emailIds - Array of email IDs to process
 * @returns Job ID
 */
export async function queueEmailBatch(emailIds: string[]): Promise<string> {
  const job = await batchEmailQueue.add(
    "process-emails",
    { emailIds },
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

  log("INFO", `Queued ${emailIds.length} emails for processing`, job.id)
  return job.id
}

/**
 * Gets the status of a batch email job
 * @param jobId - Job ID
 * @returns Job status
 */
export async function getEmailBatchStatus(jobId: string): Promise<any> {
  const job = await batchEmailQueue.getJob(jobId)
  if (!job) {
    return { status: "not_found" }
  }

  const state = await job.getState()
  const progress = job.progress

  return {
    id: job.id,
    status: state,
    progress,
    data: job.data,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
  }
}
