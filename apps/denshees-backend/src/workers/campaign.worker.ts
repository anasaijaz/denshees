import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { processCampaignJob } from "../jobs/fetch-campaigns.js";

const campaignWorker = new Worker(
  "campaignQueue",
  async () => {
    await processCampaignJob();
  },
  { connection: redis }
);

export { campaignWorker };
