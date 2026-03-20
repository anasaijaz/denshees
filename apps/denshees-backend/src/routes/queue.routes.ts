import { Hono } from "hono";
import campaignQueue from "../queues/campaign.queue.js";
import authQueue from "../queues/auth.queue.js";

const queueRoutes = new Hono();

export { queueRoutes };
