import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * End-to-end pipeline test: fetch-campaigns → batch-emails → email-service
 *
 * Mocks only the external boundaries (Prisma, nodemailer, Redis/BullMQ)
 * to test the full flow and prove where the bugs cause FAILED status.
 */

// Use vi.hoisted() so these are available inside hoisted vi.mock factories
const { mockPrisma, enqueuedBatches, mockSendMail } = vi.hoisted(() => ({
  mockPrisma: {
    campaign: { findMany: vi.fn() },
    campaignEmail: { findMany: vi.fn(), update: vi.fn() },
    pitchEmail: { findFirst: vi.fn() },
    campaignMessage: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    user: { update: vi.fn() },
  },
  enqueuedBatches: [] as string[][],
  mockSendMail: vi.fn().mockResolvedValue({ messageId: "<msg-1@test>" }),
}));

vi.mock("../services/prisma.service.js", () => ({
  prisma: mockPrisma,
}));

vi.mock("../utils/logger.js", () => ({ log: vi.fn() }));

vi.mock("../queues/batch-email.queue.js", () => ({
  enqueueEmailBatches: vi.fn(async (ids: string[]) => {
    enqueuedBatches.push(ids);
    return ["job-1"];
  }),
  getEnqueuedEmailIds: vi.fn(async () => new Set<string>()),
  removeEnqueuedEmailIds: vi.fn(),
}));

vi.mock("../utils/credential-service.js", () => {
  const transporters = new Map<string, any>();
  return {
    extractUniqueCredentials: vi.fn(() => []),
    setupEmailTransporters: vi.fn(() => {
      transporters.set("cred-1", { sendMail: mockSendMail });
    }),
    getEmailTransporter: vi.fn((id: string) => transporters.get(id) ?? null),
    emailTransporters: transporters,
  };
});

vi.mock("../services/credential-service.js", () => ({
  getCredentialSentCount: vi.fn().mockResolvedValue(0),
}));

vi.mock("html-to-text", () => ({
  htmlToText: vi.fn((html: string) => html.replace(/<[^>]*>/g, "")),
}));

// Mock only delay from helpers to avoid 20s+ waits, keep real isValidEmail/applyHoganPersonalization
vi.mock("../utils/helpers.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/helpers.js")>();
  return { ...actual, delay: vi.fn().mockResolvedValue(undefined) };
});

// ----- Imports (after all mocks) -----
import { processCampaignJob } from "../jobs/fetch-campaigns.js";
import { processEmailBatchJob } from "../jobs/batch-emails.js";

// ----- Fixtures -----

function fullCampaign() {
  return {
    id: "campaign-1",
    deleted: false,
    status: "RUNNING",
    userId: "user-1",
    emailDeliveryPeriod: "MORNING",
    activeDays: ["wednesday"],
    daysInterval: 1,
    maxStageCount: 2,
    user: {
      id: "user-1",
      email: "owner@test.com",
      timezone: "UTC",
      credits: 10,
    },
  };
}

function fullCampaignEmail() {
  return {
    id: "ce-1",
    email: "lead@example.com",
    name: "Lead Person",
    stage: 0,
    status: "PENDING",
    personalization: { company: "Acme" },
    sentAt: null,
    credId: null,
    campaignId: "campaign-1",
    campaign: {
      id: "campaign-1",
      maxStageCount: 2,
      isTrackingEnabled: false,
      daysInterval: 1,
      user: { id: "user-1", email: "owner@test.com", credits: 10 },
      campaignEmailCredentials: [
        {
          emailCredential: {
            id: "cred-1",
            host: "smtp.test.com",
            port: 587,
            secure: false,
            username: "sender@test.com",
            password: "pass123",
            dailyLimit: 50,
          },
        },
      ],
    },
  };
}

function fullPitch() {
  return {
    id: "pitch-1",
    subject: "Hello {{name}}",
    message: "<p>Hi {{name}}, welcome to {{company}}</p>",
    campaignId: "campaign-1",
    stage: 0,
  };
}

// ----- Tests -----

describe("E2E pipeline: fetch → batch → send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enqueuedBatches.length = 0;
    mockPrisma.campaignEmail.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.campaignMessage.create.mockResolvedValue({});
    mockSendMail.mockResolvedValue({ messageId: "<msg-1@test>" });
  });

  it("fetchPitch correctly passes campaign ID string to prisma query", async () => {
    const emailFromDb = fullCampaignEmail();
    mockPrisma.campaignEmail.findMany.mockResolvedValue([emailFromDb]);
    mockPrisma.pitchEmail.findFirst.mockResolvedValue(null);

    await processEmailBatchJob(["ce-1"]);

    // Verify: campaignId is the string ID, not the full object
    const pitchQuery = mockPrisma.pitchEmail.findFirst.mock.calls[0][0];
    expect(pitchQuery.where.campaignId).toBe("campaign-1");
    expect(typeof pitchQuery.where.campaignId).toBe("string");
  });

  it("HAPPY PATH: full pipeline works when pitch IS found", async () => {
    const emailFromDb = fullCampaignEmail();
    mockPrisma.campaignEmail.findMany.mockResolvedValue([emailFromDb]);

    // Simulate: pitch IS found (as if the bug were fixed)
    mockPrisma.pitchEmail.findFirst.mockResolvedValue(fullPitch());

    const results = await processEmailBatchJob(["ce-1"]);

    // Email was sent
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mailOpts = mockSendMail.mock.calls[0][0];
    expect(mailOpts.to).toBe("lead@example.com");
    expect(mailOpts.from).toBe("sender@test.com");
    expect(mailOpts.subject).toContain("Lead Person"); // personalized

    // Credential was saved to the email record
    expect(mockPrisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "ce-1" },
      data: { credId: "cred-1" },
    });

    // Status was updated (RUNNING, stage 1)
    expect(mockPrisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "ce-1" },
      data: {
        status: "RUNNING",
        stage: 1,
        sentAt: expect.any(Date),
      },
    });

    // Campaign message record was created
    expect(mockPrisma.campaignMessage.create).toHaveBeenCalled();

    // User credits decremented
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { credits: { decrement: 1 } },
    });
  });

  it("HAPPY PATH: tracking pixel is added when enabled", async () => {
    const emailFromDb = fullCampaignEmail();
    emailFromDb.campaign.isTrackingEnabled = true;
    mockPrisma.campaignEmail.findMany.mockResolvedValue([emailFromDb]);
    mockPrisma.pitchEmail.findFirst.mockResolvedValue(fullPitch());

    await processEmailBatchJob(["ce-1"]);

    const mailOpts = mockSendMail.mock.calls[0][0];
    expect(mailOpts.html).toContain("tracking/open?id=ce-1");
  });

  it("follow-up email succeeds when credId is set", async () => {
    const emailFromDb = fullCampaignEmail();
    emailFromDb.stage = 1;
    emailFromDb.status = "RUNNING";
    emailFromDb.credId = "cred-1";

    mockPrisma.campaignEmail.findMany.mockResolvedValue([emailFromDb]);
    mockPrisma.pitchEmail.findFirst.mockResolvedValue(fullPitch());
    mockPrisma.campaignMessage.findFirst.mockResolvedValue({
      messageId: "<prev@smtp>",
    });
    mockPrisma.campaignMessage.findMany.mockResolvedValue([
      { messageId: "<prev@smtp>" },
    ]);

    await processEmailBatchJob(["ce-1"]);

    // Email was sent successfully
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    // Status was updated (not FAILED)
    expect(mockPrisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "ce-1" },
      data: {
        status: "COMPLETED",
        stage: 2,
        sentAt: expect.any(Date),
      },
    });
  });

  it("SMTP error marks email as FAILED", async () => {
    mockPrisma.campaignEmail.findMany.mockResolvedValue([fullCampaignEmail()]);
    mockPrisma.pitchEmail.findFirst.mockResolvedValue(fullPitch());
    mockSendMail.mockRejectedValue(new Error("Connection refused"));

    await processEmailBatchJob(["ce-1"]);

    expect(mockPrisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "ce-1" },
      data: { status: "FAILED" },
    });
  });

  it("rate-limit error does NOT mark FAILED (left for retry)", async () => {
    mockPrisma.campaignEmail.findMany.mockResolvedValue([fullCampaignEmail()]);
    mockPrisma.pitchEmail.findFirst.mockResolvedValue(fullPitch());

    const rateLimitErr = Object.assign(new Error("Too many login attempts"), {
      code: "EAUTH",
      responseCode: 454,
      response: "Too many login attempts, please try again later",
    });
    mockSendMail.mockRejectedValue(rateLimitErr);

    await processEmailBatchJob(["ce-1"]);

    // Should NOT have FAILED status update — only the credId save
    const failedCalls = mockPrisma.campaignEmail.update.mock.calls.filter(
      (call: any) => call[0]?.data?.status === "FAILED",
    );
    expect(failedCalls).toHaveLength(0);
  });
});

describe("E2E: fetch-campaigns time gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enqueuedBatches.length = 0;
  });

  it("full flow: campaign in MORNING period at 9am UTC enqueues emails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T09:00:00Z")); // Wednesday 9am

    mockPrisma.campaign.findMany.mockResolvedValue([fullCampaign()]);
    mockPrisma.campaignEmail.findMany.mockResolvedValue([
      {
        id: "ce-1",
        stage: 0,
        status: "PENDING",
        sentAt: null,
        campaignId: "campaign-1",
        campaign: { daysInterval: 1 },
      },
    ]);

    const result = await processCampaignJob();

    expect(enqueuedBatches).toHaveLength(1);
    expect(enqueuedBatches[0]).toContain("ce-1");

    vi.useRealTimers();
  });

  it("full flow: campaign in MORNING period at 3pm UTC is blocked", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T15:00:00Z")); // Wednesday 3pm

    mockPrisma.campaign.findMany.mockResolvedValue([fullCampaign()]);

    const result = await processCampaignJob();

    expect(enqueuedBatches).toHaveLength(0);

    vi.useRealTimers();
  });
});
