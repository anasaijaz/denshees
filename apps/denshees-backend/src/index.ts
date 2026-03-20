import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { queueRoutes } from "./routes/queue.routes.js";
import imapQueue from "./queues/imap.queue.js";
import { campaignWorker } from "./workers/campaign.worker.js";
import { authWorker } from "./workers/auth.worker.js";
import { batchemailWorker } from "./workers/batchemail.worker.js";
import { imapWorker } from "./workers/imap.worker.js";

import "dotenv/config";
import { trackingRoutes } from "./routes/tracking.routes.js";
import { miscRoutes } from "./routes/misc.routes.js";
import { imapRoutes } from "./routes/imap.routes.js";

const app = new Hono();

app.route("/queue", queueRoutes);
app.route("/tracking", trackingRoutes);
app.route("/email", imapRoutes);
app.route("/", miscRoutes);

serve({ fetch: app.fetch, port: parseInt(process.env.PORT || "8100") });

console.log("Hono server running...");
