/**
 * Email tracking routes for open and click tracking
 */

import { Hono } from "hono";
import { handleEmailOpen } from "../controllers/tracking.controller.js";

const trackingRoutes = new Hono();

// Track email opens via a tracking pixel
trackingRoutes.get("/open", handleEmailOpen);

export { trackingRoutes };
