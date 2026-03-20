import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { processAuthJob } from "../jobs/authenticate-pocketbase.js";

const authWorker = new Worker(
  "authQueue",
  async () => {
    await processAuthJob();
  },
  { connection: redis }
);

export { authWorker };
