import { Queue, redisConnection } from "../config/redis.js";

const imapQueue = new Queue("imapQueue", {
  connection: redisConnection,
});

await imapQueue.upsertJobScheduler("imap-scheduler", {
  pattern: "*/10 * * * *",
});

export default imapQueue;
