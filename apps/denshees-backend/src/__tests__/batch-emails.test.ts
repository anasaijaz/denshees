import { describe, it, expect, vi, beforeEach } from "vitest";

// ----- Mocks -----

vi.mock("../utils/logger.js", () => ({ log: vi.fn() }));

vi.mock("../utils/helpers.js", () => ({
  delay: vi.fn().mockResolvedValue(undefined), // no-op delay for fast tests
}));

vi.mock("../utils/credential-service.js", () => ({
  extractUniqueCredentials: vi.fn(() => []),
  setupEmailTransporters: vi.fn(),
}));

vi.mock("../services/campaign-service.js", () => ({
  fetchCampaignEmails: vi.fn(),
}));

vi.mock("../services/email-service.js", () => ({
  sendCampaignEmail: vi.fn(),
}));

vi.mock("../queues/batch-email.queue.js", () => ({
  removeEnqueuedEmailIds: vi.fn(),
}));

import { fetchCampaignEmails } from "../services/campaign-service.js";
import { sendCampaignEmail } from "../services/email-service.js";
import {
  extractUniqueCredentials,
  setupEmailTransporters,
} from "../utils/credential-service.js";
import { removeEnqueuedEmailIds } from "../queues/batch-email.queue.js";
import { processEmailBatchJob } from "../jobs/batch-emails.js";
import type { EmailRecord } from "../models/email.js";

// ----- Helpers -----

function makeEmail(overrides: Partial<any> = {}): EmailRecord {
  return {
    id: "email-1",
    email: "test@example.com",
    name: "Test",
    stage: 0,
    status: "PENDING",
    personalization: {},
    campaign: {
      id: "campaign-1",
      maxStageCount: 3,
      user: { id: "user-1", email: "o@t.com", credits: 10 },
      campaignEmailCredentials: [
        {
          emailCredential: {
            id: "cred-1",
            host: "smtp.example.com",
            port: 587,
            secure: false,
            username: "sender@example.com",
            password: "secret",
            dailyLimit: 50,
          },
        },
      ],
    },
    ...overrides,
  } as any;
}

// ----- Tests -----

describe("processEmailBatchJob", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no email IDs provided", async () => {
    const result = await processEmailBatchJob([]);
    expect(result).toEqual([]);
    expect(fetchCampaignEmails).not.toHaveBeenCalled();
  });

  it("accepts object format with emailIds property", async () => {
    vi.mocked(fetchCampaignEmails).mockResolvedValue([]);

    const result = await processEmailBatchJob({ emailIds: [] });
    expect(result).toEqual([]);
  });

  it("fetches emails, sets up transporters, and processes", async () => {
    const emails = [makeEmail({ id: "e-1" }), makeEmail({ id: "e-2" })];
    vi.mocked(fetchCampaignEmails).mockResolvedValue(emails);
    vi.mocked(sendCampaignEmail).mockResolvedValue();

    const result = await processEmailBatchJob(["e-1", "e-2"]);

    expect(fetchCampaignEmails).toHaveBeenCalledWith(["e-1", "e-2"]);
    expect(extractUniqueCredentials).toHaveBeenCalledWith(emails);
    expect(setupEmailTransporters).toHaveBeenCalled();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it("removes enqueued email IDs after processing", async () => {
    vi.mocked(fetchCampaignEmails).mockResolvedValue([makeEmail()]);
    vi.mocked(sendCampaignEmail).mockResolvedValue();

    await processEmailBatchJob(["email-1"]);

    expect(removeEnqueuedEmailIds).toHaveBeenCalledWith(["email-1"]);
  });

  it("removes enqueued IDs even on error", async () => {
    vi.mocked(fetchCampaignEmails).mockRejectedValue(new Error("DB down"));

    const result = await processEmailBatchJob(["email-1"]);

    expect(result).toEqual([]);
    expect(removeEnqueuedEmailIds).toHaveBeenCalledWith(["email-1"]);
  });

  it("continues processing remaining emails when one fails", async () => {
    const emails = [makeEmail({ id: "e-1" }), makeEmail({ id: "e-2" })];
    vi.mocked(fetchCampaignEmails).mockResolvedValue(emails);
    vi.mocked(sendCampaignEmail)
      .mockRejectedValueOnce(new Error("send failed"))
      .mockResolvedValueOnce(undefined);

    const result = await processEmailBatchJob(["e-1", "e-2"]);

    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    // First email threw, so only the second is in results
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("e-2");
  });

  it("groups emails as 'unassigned' when credId is not set", async () => {
    const emails = [
      makeEmail({ id: "e-1", credId: undefined }),
      makeEmail({ id: "e-2", credId: undefined }),
    ];
    vi.mocked(fetchCampaignEmails).mockResolvedValue(emails);
    vi.mocked(sendCampaignEmail).mockResolvedValue();

    await processEmailBatchJob(["e-1", "e-2"]);

    // Both emails processed (all grouped together under "unassigned")
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
  });

  it("groups emails by credential when credId IS present", async () => {
    const emails = [
      makeEmail({ id: "e-1", credId: "cred-A" }),
      makeEmail({ id: "e-2", credId: "cred-B" }),
      makeEmail({ id: "e-3", credId: "cred-A" }),
    ];
    vi.mocked(fetchCampaignEmails).mockResolvedValue(emails);
    vi.mocked(sendCampaignEmail).mockResolvedValue();

    await processEmailBatchJob(["e-1", "e-2", "e-3"]);

    expect(sendCampaignEmail).toHaveBeenCalledTimes(3);
  });
});
