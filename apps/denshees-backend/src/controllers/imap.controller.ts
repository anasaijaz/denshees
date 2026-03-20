import type { Context } from "hono";
import { testImapConnection } from "../services/imap.service.js";

export async function handleTestImap(c: Context) {
  try {
    const { username, password, host, port, secure } = await c.req.json();

    if (!username || !password) {
      return c.json({ message: "Username and password are required" }, 400);
    }

    const result = await testImapConnection(
      username,
      password,
      host,
      port,
      secure,
    );

    if (result.success) {
      return c.json({ message: "IMAP credentials are valid" }, 200);
    } else {
      return c.json(
        { message: "Invalid IMAP credentials", error: result.error },
        401,
      );
    }
  } catch (error: any) {
    console.error("Error testing IMAP connection:", error.message);
    return c.json(
      { message: "Failed to test IMAP connection", error: error.message },
      500,
    );
  }
}
