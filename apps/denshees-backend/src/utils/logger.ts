/**
 * Logger utility for standardized logging across the email processor
 */

export type LogLevel = "ERROR" | "WARN" | "DEBUG" | "INFO";

/**
 * Simple logging function that masks sensitive data
 */
export function log(
  level: LogLevel,
  message: string,
  txId = "",
  data: Record<string, any> | null = null
): void {
  const timestamp = new Date().toISOString();
  const txInfo = txId ? `[${txId}]` : "";

  // Mask sensitive data if present
  let logData: Record<string, any> | null = null;
  if (data) {
    logData = JSON.parse(JSON.stringify(data)); // Clone to avoid modifying original

    // Mask sensitive fields
    const sensitiveFields = [
      "password",
      "pass",
      "secret",
      "token",
      "key",
      "auth",
    ];

    const maskObject = (obj: Record<string, any>): void => {
      if (!obj || typeof obj !== "object") return;

      Object.keys(obj).forEach((key) => {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object") {
          maskObject(obj[key]);
        }
      });
    };

    maskObject(logData!);
  }

  const logMessage = `${timestamp} ${level} ${txInfo} ${message}`;

  if (level === "ERROR") {
    console.error(logMessage, logData ? logData : "");
  } else if (level === "WARN") {
    console.warn(logMessage, logData ? logData : "");
  } else if (level === "DEBUG" && process.env.LOG_LEVEL === "DEBUG") {
    console.debug(logMessage, logData ? logData : "");
  } else {
    console.log(logMessage, logData ? logData : "");
  }
}
