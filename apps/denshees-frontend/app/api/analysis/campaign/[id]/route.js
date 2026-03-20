import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import prisma from "@/lib/prisma";

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

    // Fetch campaign details
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Verify that the campaign belongs to the current user
    if (campaign.userId !== currUser.userId) {
      return NextResponse.json(
        { error: "Unauthorized access to campaign" },
        { status: 403 },
      );
    }

    // Fetch campaign emails count
    const totalRecipients = await prisma.campaignEmail.count({
      where: { campaignId: id },
    });

    // Compute stats via aggregates
    const [emailsSent, responses, openCount] = await Promise.all([
      prisma.campaignMessage.count({
        where: { sent: true, campaignEmail: { campaignId: id } },
      }),
      prisma.campaignMessage.count({
        where: { sent: false, campaignEmail: { campaignId: id } },
      }),
      prisma.campaignOpen.count({
        where: { campaignEmail: { campaignId: id } },
      }),
    ]);

    const openRate = totalRecipients > 0 ? openCount / totalRecipients : 0;
    const responseRate = totalRecipients > 0 ? responses / totalRecipients : 0;

    // Fetch recent activities for this campaign
    const activities = [];

    // 1. Recent email sends
    try {
      const recentSends = await prisma.campaignMessage.findMany({
        where: { sent: true, campaignEmail: { campaignId: id } },
        orderBy: { created: "desc" },
        take: 100,
        include: { campaignEmail: true },
      });

      recentSends.forEach((message) => {
        const ce = message.campaignEmail;
        activities.push({
          type: "Email sent",
          timestamp: message.created,
          details: formatRecipientDetails(ce),
          recipientName: ce?.name || "",
          recipientEmail: ce?.email || "",
        });
      });
    } catch (error) {
      console.error("Error fetching recent sends:", error);
    }

    // 2. Recent email opens
    try {
      const recentOpens = await prisma.campaignOpen.findMany({
        where: { campaignEmail: { campaignId: id } },
        orderBy: { created: "desc" },
        take: 100,
        include: { campaignEmail: true },
      });

      recentOpens.forEach((open) => {
        const ce = open.campaignEmail;
        activities.push({
          type: "Email opened",
          timestamp: open.created,
          details: formatRecipientDetails(ce),
          recipientName: ce?.name || "",
          recipientEmail: ce?.email || "",
        });
      });
    } catch (error) {
      console.error("Error fetching recent opens:", error);
    }

    // 3. Recent replies
    try {
      const recentReplies = await prisma.campaignMessage.findMany({
        where: { sent: false, campaignEmail: { campaignId: id } },
        orderBy: { created: "desc" },
        take: 100,
        include: { campaignEmail: true },
      });

      recentReplies.forEach((message) => {
        const ce = message.campaignEmail;
        activities.push({
          type: "Reply received",
          timestamp: message.created,
          details: formatRecipientDetails(ce),
          recipientName: ce?.name || "",
          recipientEmail: ce?.email || "",
        });
      });
    } catch (error) {
      console.error("Error fetching recent replies:", error);
    }

    // Sort all activities by timestamp (most recent first)
    const recentActivities = activities.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.desc || "",
        created: campaign.created,
        updated: campaign.updated,
        status: campaign.status || "draft",
      },
      stats: {
        emails_sent: emailsSent,
        open_rate: openRate,
        response_rate: responseRate,
        total_recipients: totalRecipients,
      },
      recent_activities: recentActivities,
    });
  } catch (error) {
    console.error("Error fetching campaign data:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign data" },
      { status: 500 },
    );
  }
}

function formatRecipientDetails(campaignEmail) {
  if (!campaignEmail) return "Unknown recipient";
  const name = campaignEmail.name;
  const email = campaignEmail.email;
  if (name && email) return `${name} (${email})`;
  if (email) return email;
  if (name) return name;
  return "Unknown recipient";
}
