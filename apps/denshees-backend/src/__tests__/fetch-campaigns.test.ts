import { describe, it, expect, vi, beforeEach } from "vitest";

// ----- Mocks -----

vi.mock("../services/prisma.service.js", () => ({
  prisma: {
    campaign: { findMany: vi.fn() },
    campaignEmail: { findMany: vi.fn() },
  },
}));

vi.mock("../queues/batch-email.queue.js", () => ({
  enqueueEmailBatches: vi.fn().mockResolvedValue(["job-1"]),
  getEnqueuedEmailIds: vi.fn().mockResolvedValue(new Set<string>()),
}));

import { prisma } from "../services/prisma.service.js";
import {
  enqueueEmailBatches,
  getEnqueuedEmailIds,
} from "../queues/batch-email.queue.js";
import { processCampaignJob } from "../jobs/fetch-campaigns.js";

// ----- Helpers -----

/** Creates a campaign fixture with the user in a given timezone. */
function makeCampaign(overrides: Record<string, any> = {}) {
  return {
    id: "campaign-1",
    deleted: false,
    status: "RUNNING",
    userId: "user-1",
    emailDeliveryPeriod: "MORNING",
    activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    daysInterval: 1,
    maxStageCount: 3,
    user: {
      id: "user-1",
      email: "owner@test.com",
      timezone: "America/New_York",
      credits: 10,
    },
    ...overrides,
  };
}

function makeCampaignEmail(overrides: Record<string, any> = {}) {
  return {
    id: "ce-1",
    email: "lead@example.com",
    name: "Lead",
    stage: 0,
    status: "PENDING",
    sentAt: null,
    campaignId: "campaign-1",
    campaign: { daysInterval: 1 },
    ...overrides,
  };
}

// ----- Tests -----

describe("processCampaignJob", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty when no campaigns exist", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);

    const result = await processCampaignJob();

    expect(result).toEqual([]);
    expect(enqueueEmailBatches).not.toHaveBeenCalled();
  });

  it("filters out campaigns with no user timezone", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({ user: { id: "u-1", timezone: null, credits: 10 } }),
    ] as any);

    const result = await processCampaignJob();

    expect(result).toEqual([]);
  });

  it("filters out campaigns with no emailDeliveryPeriod", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({ emailDeliveryPeriod: null }),
    ] as any);

    const result = await processCampaignJob();

    expect(result).toEqual([]);
  });

  it("filters out campaigns where user has 0 credits", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({
        user: {
          id: "u-1",
          timezone: "UTC",
          credits: 0,
        },
      }),
    ] as any);

    const result = await processCampaignJob();

    expect(result).toEqual([]);
  });

  it("filters out campaigns outside delivery period", async () => {
    // Force current hour to be 22 (NIGHT period = 18-24) but campaign expects MORNING (6-12)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T22:00:00Z")); // 22:00 UTC

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({
        emailDeliveryPeriod: "MORNING",
        user: { id: "u-1", timezone: "UTC", credits: 10, email: "o@t.com" },
      }),
    ] as any);

    const result = await processCampaignJob();

    expect(result).toEqual([]);
    vi.useRealTimers();
  });

  it("includes campaigns within delivery period", async () => {
    vi.useFakeTimers();
    // 9 AM UTC on a Wednesday
    vi.setSystemTime(new Date("2026-03-25T09:00:00Z"));

    const campaign = makeCampaign({
      emailDeliveryPeriod: "MORNING",
      activeDays: ["wednesday"],
      user: { id: "u-1", timezone: "UTC", credits: 10, email: "o@t.com" },
    });

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([campaign] as any);
    vi.mocked(prisma.campaignEmail.findMany).mockResolvedValue([
      makeCampaignEmail({ campaignId: campaign.id }),
    ] as any);

    const result = await processCampaignJob();

    expect(enqueueEmailBatches).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("filters out campaigns on inactive days", async () => {
    vi.useFakeTimers();
    // Sunday 9 AM UTC
    vi.setSystemTime(new Date("2026-03-22T09:00:00Z"));

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({
        emailDeliveryPeriod: "MORNING",
        // Only active on weekdays
        activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        user: { id: "u-1", timezone: "UTC", credits: 10, email: "o@t.com" },
      }),
    ] as any);

    const result = await processCampaignJob();

    expect(result).toEqual([]);
    vi.useRealTimers();
  });

  it("does not re-enqueue already enqueued email IDs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T09:00:00Z")); // Wednesday 9am UTC

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({
        emailDeliveryPeriod: "MORNING",
        activeDays: ["wednesday"],
        user: { id: "u-1", timezone: "UTC", credits: 10, email: "o@t.com" },
      }),
    ] as any);

    vi.mocked(prisma.campaignEmail.findMany).mockResolvedValue([
      makeCampaignEmail({ id: "ce-already-queued" }),
    ] as any);

    // This ID is already enqueued
    vi.mocked(getEnqueuedEmailIds).mockResolvedValue(
      new Set(["ce-already-queued"]),
    );

    const result = await processCampaignJob();

    expect(enqueueEmailBatches).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("filters out emails sent too recently based on daysInterval", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T09:00:00Z")); // Wednesday 9am UTC

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({
        emailDeliveryPeriod: "MORNING",
        activeDays: ["wednesday"],
        user: { id: "u-1", timezone: "UTC", credits: 10, email: "o@t.com" },
      }),
    ] as any);

    // This email was sent yesterday and daysInterval=5, so it should NOT be sent yet.
    const yesterday = new Date("2026-03-24T09:00:00Z");
    vi.mocked(prisma.campaignEmail.findMany).mockResolvedValue([
      makeCampaignEmail({
        id: "ce-too-soon",
        stage: 1,
        sentAt: yesterday,
        campaign: { daysInterval: 5 },
      }),
    ] as any);

    const result = await processCampaignJob();

    // Fixed: email is correctly filtered out (only 1 day passed, need 5)
    expect(enqueueEmailBatches).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("enqueues emails when enough days have passed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T09:00:00Z")); // Wednesday 9am UTC

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({
        emailDeliveryPeriod: "MORNING",
        activeDays: ["wednesday"],
        user: { id: "u-1", timezone: "UTC", credits: 10, email: "o@t.com" },
      }),
    ] as any);

    // Sent 6 days ago with daysInterval=5 → should be sent
    const sixDaysAgo = new Date("2026-03-19T09:00:00Z");
    vi.mocked(prisma.campaignEmail.findMany).mockResolvedValue([
      makeCampaignEmail({
        id: "ce-ready",
        stage: 1,
        sentAt: sixDaysAgo,
        campaign: { daysInterval: 5 },
      }),
    ] as any);

    const result = await processCampaignJob();

    expect(enqueueEmailBatches).toHaveBeenCalledWith(["ce-ready"]);

    vi.useRealTimers();
  });

  it("handles errors gracefully and returns empty array", async () => {
    vi.mocked(prisma.campaign.findMany).mockRejectedValue(
      new Error("DB connection lost"),
    );

    const result = await processCampaignJob();

    expect(result).toEqual([]);
  });
});

describe("delivery period boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  const periods = [
    { name: "MORNING", validHour: 9, invalidHour: 13 },
    { name: "EVENING", validHour: 15, invalidHour: 19 },
    { name: "NIGHT", validHour: 21, invalidHour: 5 },
    { name: "MIDNIGHT", validHour: 3, invalidHour: 7 },
  ];

  for (const { name, validHour, invalidHour } of periods) {
    it(`${name}: enqueues during valid hour (${validHour}:00)`, async () => {
      vi.useFakeTimers();
      // Use a Wednesday
      const date = new Date(
        `2026-03-25T${String(validHour).padStart(2, "0")}:00:00Z`,
      );
      vi.setSystemTime(date);

      vi.mocked(prisma.campaign.findMany).mockResolvedValue([
        makeCampaign({
          emailDeliveryPeriod: name,
          activeDays: ["wednesday"],
          user: { id: "u-1", timezone: "UTC", credits: 10, email: "o@t.com" },
        }),
      ] as any);

      vi.mocked(prisma.campaignEmail.findMany).mockResolvedValue([
        makeCampaignEmail(),
      ] as any);

      await processCampaignJob();

      expect(enqueueEmailBatches).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it(`${name}: does NOT enqueue during invalid hour (${invalidHour}:00)`, async () => {
      vi.useFakeTimers();
      const date = new Date(
        `2026-03-25T${String(invalidHour).padStart(2, "0")}:00:00Z`,
      );
      vi.setSystemTime(date);

      vi.mocked(prisma.campaign.findMany).mockResolvedValue([
        makeCampaign({
          emailDeliveryPeriod: name,
          activeDays: ["wednesday"],
          user: { id: "u-1", timezone: "UTC", credits: 10, email: "o@t.com" },
        }),
      ] as any);

      await processCampaignJob();

      expect(enqueueEmailBatches).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  }
});

describe("timezone handling", () => {
  beforeEach(() => vi.clearAllMocks());

  it("respects user timezone for delivery period check", async () => {
    vi.useFakeTimers();
    // 14:00 UTC = 9:00 AM EST (America/New_York is UTC-5 in March)
    vi.setSystemTime(new Date("2026-03-25T14:00:00Z")); // Wednesday

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({
        emailDeliveryPeriod: "MORNING", // 6-12 in user's timezone
        activeDays: ["wednesday"],
        user: {
          id: "u-1",
          timezone: "America/New_York",
          credits: 10,
          email: "o@t.com",
        },
      }),
    ] as any);

    vi.mocked(prisma.campaignEmail.findMany).mockResolvedValue([
      makeCampaignEmail(),
    ] as any);

    await processCampaignJob();

    // 9 AM EST is within MORNING (6-12), so emails should be enqueued
    expect(enqueueEmailBatches).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("rejects when UTC time is morning but user timezone is not", async () => {
    vi.useFakeTimers();
    // 9:00 UTC = 4:00 AM EST → MIDNIGHT period, not MORNING
    vi.setSystemTime(new Date("2026-03-25T09:00:00Z")); // Wednesday

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      makeCampaign({
        emailDeliveryPeriod: "MORNING",
        activeDays: ["wednesday"],
        user: {
          id: "u-1",
          timezone: "America/New_York",
          credits: 10,
          email: "o@t.com",
        },
      }),
    ] as any);

    await processCampaignJob();

    // 4 AM EST is NOT within MORNING (6-12)
    expect(enqueueEmailBatches).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
