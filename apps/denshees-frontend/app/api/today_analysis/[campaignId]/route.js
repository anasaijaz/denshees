import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const { campaignId } = params;

  try {
    // Compute current stats: count of emails per stage + total opened
    const campaignEmails = await prisma.campaignEmail.findMany({
      where: { campaignId },
      select: { stage: true, opened: true },
    });

    const stagesSum = campaignEmails.reduce(
      (sum, e) => sum + (e.stage || 0),
      0,
    );
    const openedSum = campaignEmails.reduce(
      (sum, e) => sum + (e.opened || 0),
      0,
    );

    return NextResponse.json({
      campaignId,
      stages_sum: stagesSum,
      opened_sum: openedSum,
      total: campaignEmails.length,
    });
  } catch (error) {
    console.error(
      `[API] Error getting today's analysis for campaign ${campaignId}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
