import { Queue, redisConnection } from "../config/redis.js";

const campaignQueue = new Queue("campaignQueue", {
  connection: redisConnection,
});

await campaignQueue.upsertJobScheduler(
  "email-scheduler",
  { pattern: "0 * * * *" }, // Runs every hour
  {
    name: "campaign-queue",
    opts: {
      backoff: 3,
      attempts: 5,
      removeOnFail: 1000,
    },
  }
);

export default campaignQueue;
