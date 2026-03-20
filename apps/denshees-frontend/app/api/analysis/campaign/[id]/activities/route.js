import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import Hogan from "hogan.js";
import prisma from "@/lib/prisma";

/**
 * GET /api/analysis/campaign/[id]/activities?date=2026-02-25
 *
 * Returns all activities for a single day (or today by default).
 * Supports fetching up to 50 events per type so we get a full day picture.
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get("authorization");
    const currUser = jwtDecode(token);

    if (!currUser?.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.userId !== currUser.userId) {
      return NextResponse.json(
        { error: "Unauthorized access to campaign" },
        { status: 403 },
      );
    }

    // Parse target date from query string (YYYY-MM-DD) – defaults to today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let dayStart, dayEnd;
    if (dateParam) {
      dayStart = new Date(`${dateParam}T00:00:00.000Z`);
      dayEnd = new Date(`${dateParam}T23:59:59.999Z`);
    } else {
      const now = new Date();
      dayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      dayEnd = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );
    }

    const activities = [];

    // 1. Email sends
    try {
      const sends = await prisma.campaignMessage.findMany({
        where: {
          sent: true,
          campaignEmail: { campaignId: id },
          created: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { created: "desc" },
        take: 50,
        include: {
          campaignEmail: true,
          pitch: true,
        },
      });

      sends.forEach((msg) => {
        const ce = msg.campaignEmail;
        const pitch = msg.pitch;
        let subject = "";
        let body = "";
        try {
          if (pitch?.subject) {
            subject = Hogan.compile(pitch.subject).render({
              name: ce?.name || "",
            });
          }
          if (pitch?.message) {
            body = Hogan.compile(pitch.message).render({
              name: ce?.name || "",
            });
          }
        } catch (_) {}
        activities.push({
          type: "Email sent",
          timestamp: msg.created,
          recipientName: ce?.name || "",
          recipientEmail: ce?.email || "",
          subject,
          body,
        });
      });
    } catch (err) {
      console.error("Error fetching sends:", err);
    }

    // 2. Email opens
    try {
      const opens = await prisma.campaignOpen.findMany({
        where: {
          campaignEmail: { campaignId: id },
          created: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { created: "desc" },
        take: 50,
        include: { campaignEmail: true },
      });

      opens.forEach((open) => {
        const ce = open.campaignEmail;
        activities.push({
          type: "Email opened",
          timestamp: open.created,
          recipientName: ce?.name || "",
          recipientEmail: ce?.email || "",
        });
      });
    } catch (err) {
      console.error("Error fetching opens:", err);
    }

    // 3. Replies
    try {
      const replies = await prisma.campaignMessage.findMany({
        where: {
          sent: false,
          campaignEmail: { campaignId: id },
          created: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { created: "desc" },
        take: 50,
        include: { campaignEmail: true },
      });

      replies.forEach((msg) => {
        const ce = msg.campaignEmail;
        activities.push({
          type: "Reply received",
          timestamp: msg.created,
          recipientName: ce?.name || "",
          recipientEmail: ce?.email || "",
          subject: "",
          body: msg.text || "",
        });
      });
    } catch (err) {
      console.error("Error fetching replies:", err);
    }

    // Sort most recent first
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({
      date: dateParam || dayStart.toISOString().split("T")[0],
      activities,
      summary: {
        total: activities.length,
        sent: activities.filter((a) => a.type === "Email sent").length,
        opened: activities.filter((a) => a.type === "Email opened").length,
        replied: activities.filter((a) => a.type === "Reply received").length,
      },
    });
  } catch (error) {
    console.error("Error fetching day activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch day activities" },
      { status: 500 },
    );
  }
}
