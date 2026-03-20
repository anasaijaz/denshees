/**
 * Miscellaneous routes including health checks and utility endpoints
 */

import { Hono } from "hono";
import {
  handleHealthCheck,
  handleSimpleHealthCheck,
} from "../controllers/misc.controller.js";

const miscRoutes = new Hono();

// Comprehensive health check that verifies all services
miscRoutes.get("/health", handleHealthCheck);

// Simple health check for basic availability
miscRoutes.get("/ping", handleSimpleHealthCheck);

export { miscRoutes };
