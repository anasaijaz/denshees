import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { checkEmails } from "../services/imap.service.js";

const imapWorker = new Worker(
  "imapQueue",
  async () => {
    console.log("Running IMAP email check...");

    try {
      const results = await checkEmails();
      console.log("IMAP check results:", results);
    } catch (error) {
      console.log("IMAP worker error:", error);
    }
  },
  { connection: redis },
);

export { imapWorker };
