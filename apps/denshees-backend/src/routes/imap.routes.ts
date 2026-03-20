import { Hono } from "hono";
import { handleTestImap } from "../controllers/imap.controller.js";

const imapRoutes = new Hono();

imapRoutes.post("/test-imap", handleTestImap);

export { imapRoutes };
