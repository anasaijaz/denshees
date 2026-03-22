import { describe, it, expect, vi, beforeEach } from "vitest";

// ----- Mocks -----

vi.mock("../services/prisma.service.js", () => ({
  prisma: {
    campaignEmail: { update: vi.fn() },
    campaignMessage: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../utils/logger.js", () => ({ log: vi.fn() }));

vi.mock("../utils/helpers.js", () => ({
  isValidEmail: vi.fn((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
  applyHoganPersonalization: vi.fn(() => ({
    subject: "Test Subject",
    body: "<p>Test body</p>",
  })),
}));

vi.mock("../utils/credential-service.js", () => ({
  getEmailTransporter: vi.fn(),
}));

vi.mock("../services/campaign-service.js", () => ({
  fetchPitch: vi.fn(),
  updateEmailStatus: vi.fn(),
  createCampaignMessage: vi.fn(),
}));

vi.mock("../services/credential-service.js", () => ({
  getCredentialSentCount: vi.fn(),
}));

vi.mock("html-to-text", () => ({
  htmlToText: vi.fn(() => "plain text"),
}));

import { prisma } from "../services/prisma.service.js";
import { getEmailTransporter } from "../utils/credential-service.js";
import {
  fetchPitch,
  updateEmailStatus,
  createCampaignMessage,
} from "../services/campaign-service.js";
import { getCredentialSentCount } from "../services/credential-service.js";
import { sendCampaignEmail } from "../services/email-service.js";
import type { EmailRecord } from "../models/email.js";

// ----- Helpers -----

function makeCred(overrides: Record<string, any> = {}) {
  return {
    id: "cred-1",
    host: "smtp.example.com",
    port: 587,
    secure: false,
    username: "sender@example.com",
    password: "secret",
    dailyLimit: 50,
    ...overrides,
  };
}

function makeEmail(overrides: Partial<any> = {}): EmailRecord {
  return {
    id: "email-1",
    email: "recipient@example.com",
    name: "Recipient",
    stage: 0,
    status: "PENDING",
    personalization: {},
    campaign: {
      id: "campaign-1",
      maxStageCount: 3,
      isTrackingEnabled: false,
      user: { id: "user-1", email: "owner@test.com", credits: 10 },
      campaignEmailCredentials: [{ emailCredential: makeCred() }],
    },
    ...overrides,
  } as any;
}

const mockTransporter = {
  sendMail: vi.fn().mockResolvedValue({ messageId: "<msg-123@smtp>" }),
};

/**
 * Sets up the "happy path" mocks so a test can override one aspect at a time.
 */
function setupHappyPath() {
  vi.mocked(fetchPitch).mockResolvedValue({
    id: "pitch-1",
    subject: "Hello {{name}}",
    message: "<p>Hi {{name}}</p>",
  });
  vi.mocked(getCredentialSentCount).mockResolvedValue(0);
  vi.mocked(getEmailTransporter).mockReturnValue(mockTransporter as any);
  vi.mocked(prisma.campaignEmail.update).mockResolvedValue({} as any);
  vi.mocked(updateEmailStatus).mockResolvedValue();
  vi.mocked(createCampaignMessage).mockResolvedValue();
  mockTransporter.sendMail.mockResolvedValue({ messageId: "<msg-123@smtp>" });
}

// ----- Tests -----

describe("sendCampaignEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHappyPath();
  });

  // ================== HAPPY PATH ==================

  it("sends email successfully on happy path", async () => {
    await sendCampaignEmail(makeEmail(), "tx-test");

    expect(fetchPitch).toHaveBeenCalled();
    expect(mockTransporter.sendMail).toHaveBeenCalled();
    expect(updateEmailStatus).toHaveBeenCalled();
    expect(createCampaignMessage).toHaveBeenCalled();
  });

  // ================== FAILED: Invalid recipient email ==================

  it("marks FAILED when recipient email is missing", async () => {
    const email = makeEmail({ email: null });

    await sendCampaignEmail(email, "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
    expect(fetchPitch).not.toHaveBeenCalled();
  });

  it("marks FAILED when recipient email is invalid", async () => {
    const email = makeEmail({ email: "not-an-email" });

    await sendCampaignEmail(email, "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
  });

  // ================== FAILED: No pitch found ==================

  it("marks FAILED when no pitch is found for campaign/stage", async () => {
    vi.mocked(fetchPitch).mockResolvedValue(null);

    await sendCampaignEmail(makeEmail(), "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });

  // ================== FAILED: No credentials on campaign ==================

  it("marks FAILED when campaign has no email credentials", async () => {
    const email = makeEmail({
      campaign: {
        id: "campaign-1",
        maxStageCount: 3,
        isTrackingEnabled: false,
        user: { id: "user-1", email: "o@t.com", credits: 10 },
        campaignEmailCredentials: [],
      },
    });

    await sendCampaignEmail(email, "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
  });

  // ================== NOT FAILED: All creds at daily limit (stage 0) ==================

  it("returns early (no FAILED) when all credentials at daily limit for stage 0", async () => {
    vi.mocked(getCredentialSentCount).mockResolvedValue(100);

    await sendCampaignEmail(makeEmail(), "tx");

    // Should NOT mark as FAILED — just returns
    expect(prisma.campaignEmail.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    );
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });

  // ================== FAILED: No saved cred for follow-up (stage > 0) ==================

  it("marks FAILED for follow-up when credId is missing", async () => {
    const email = makeEmail({
      stage: 1,
      credId: undefined,
    });

    await sendCampaignEmail(email, "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
  });

  it("succeeds for follow-up when credId is present", async () => {
    const email = makeEmail({
      stage: 1,
      credId: "cred-1",
    });

    await sendCampaignEmail(email, "tx");

    expect(mockTransporter.sendMail).toHaveBeenCalled();
  });

  it("marks FAILED when saved credential not found in campaign creds", async () => {
    const email = makeEmail({
      stage: 1,
      credId: "nonexistent-cred-id",
    });

    await sendCampaignEmail(email, "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
  });

  // ================== NOT FAILED: Follow-up cred at daily limit ==================

  it("returns early (no FAILED) when follow-up credential at daily limit", async () => {
    vi.mocked(getCredentialSentCount).mockResolvedValue(100);

    const email = makeEmail({
      stage: 1,
      credId: "cred-1",
    });

    await sendCampaignEmail(email, "tx");

    // The code does NOT mark FAILED here — just returns with no status update
    expect(prisma.campaignEmail.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    );
  });

  // ================== FAILED: Invalid/incomplete credential ==================

  it("marks FAILED when credential has no username", async () => {
    const email = makeEmail({
      campaign: {
        id: "campaign-1",
        maxStageCount: 3,
        isTrackingEnabled: false,
        user: { id: "user-1", email: "o@t.com", credits: 10 },
        campaignEmailCredentials: [
          { emailCredential: makeCred({ username: null }) },
        ],
      },
    });

    await sendCampaignEmail(email, "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
  });

  it("marks FAILED when credential has no password", async () => {
    const email = makeEmail({
      campaign: {
        id: "campaign-1",
        maxStageCount: 3,
        isTrackingEnabled: false,
        user: { id: "user-1", email: "o@t.com", credits: 10 },
        campaignEmailCredentials: [
          { emailCredential: makeCred({ password: null }) },
        ],
      },
    });

    await sendCampaignEmail(email, "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
  });

  // ================== NOT FAILED: No transporter ==================

  it("returns early (no FAILED) when no transporter found", async () => {
    vi.mocked(getEmailTransporter).mockReturnValue(null);

    await sendCampaignEmail(makeEmail(), "tx");

    // Silently returns — no FAILED status set
    expect(prisma.campaignEmail.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    );
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });

  // ================== FAILED: sendMail EENVELOPE error ==================

  it("marks FAILED on EENVELOPE sendMail error", async () => {
    const envelopeError = Object.assign(new Error("Recipient rejected"), {
      code: "EENVELOPE",
    });
    mockTransporter.sendMail.mockRejectedValue(envelopeError);

    await sendCampaignEmail(makeEmail(), "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
  });

  // ================== NOT FAILED: Rate limit error ==================

  it("does NOT mark FAILED on rate limit error (retryable)", async () => {
    const rateLimitError = Object.assign(new Error("Rate limited"), {
      code: "EAUTH",
      responseCode: 454,
      response: "Too many login attempts, please try again later",
    });
    mockTransporter.sendMail.mockRejectedValue(rateLimitError);

    await sendCampaignEmail(makeEmail(), "tx");

    // Email status should NOT be updated — left for retry
    expect(prisma.campaignEmail.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    );
  });

  // ================== FAILED: Generic sendMail error ==================

  it("marks FAILED on generic sendMail errors", async () => {
    mockTransporter.sendMail.mockRejectedValue(
      new Error("SMTP connection lost"),
    );

    await sendCampaignEmail(makeEmail(), "tx");

    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { status: "FAILED" },
    });
  });

  // ================== NOT FAILED: Outer catch ==================

  it("does NOT mark FAILED on unexpected outer error", async () => {
    // Force an unexpected error before any status update logic
    vi.mocked(fetchPitch).mockRejectedValue(new Error("unexpected crash"));

    await sendCampaignEmail(makeEmail(), "tx");

    // The outer catch only logs — does not update status
    expect(prisma.campaignEmail.update).not.toHaveBeenCalled();
  });

  // ================== Tracking pixel ==================

  it("adds tracking pixel when isTrackingEnabled is true", async () => {
    const email = makeEmail({
      campaign: {
        id: "campaign-1",
        maxStageCount: 3,
        isTrackingEnabled: true,
        user: { id: "user-1", email: "o@t.com", credits: 10 },
        campaignEmailCredentials: [{ emailCredential: makeCred() }],
      },
    });

    await sendCampaignEmail(email, "tx");

    const sendCall = mockTransporter.sendMail.mock.calls[0][0];
    expect(sendCall.html).toContain("tracking/open?id=email-1");
  });

  it("does NOT add tracking pixel when isTrackingEnabled is false", async () => {
    await sendCampaignEmail(makeEmail(), "tx");

    const sendCall = mockTransporter.sendMail.mock.calls[0][0];
    expect(sendCall.html).not.toContain("tracking/open");
  });

  // ================== Credential selection for stage 0 ==================

  it("saves selected credential to email record for stage 0", async () => {
    await sendCampaignEmail(makeEmail(), "tx");

    // First update call is saving the credId
    expect(prisma.campaignEmail.update).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { credId: "cred-1" },
    });
  });

  // ================== Follow-up threading ==================

  it("adds threading headers for follow-up emails (stage > 0)", async () => {
    vi.mocked(prisma.campaignMessage.findFirst).mockResolvedValue({
      messageId: "<original-msg@smtp>",
    } as any);
    vi.mocked(prisma.campaignMessage.findMany).mockResolvedValue([
      { messageId: "<original-msg@smtp>" },
      { messageId: "<reply-msg@smtp>" },
    ] as any);

    const email = makeEmail({ stage: 1, credId: "cred-1" });

    await sendCampaignEmail(email, "tx");

    const sendCall = mockTransporter.sendMail.mock.calls[0][0];
    expect(sendCall.inReplyTo).toBe("<original-msg@smtp>");
    expect(sendCall.references).toEqual([
      "<original-msg@smtp>",
      "<reply-msg@smtp>",
    ]);
  });
});
