import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const campaign = searchParams.get("campaign");

  if (!campaign) {
    return NextResponse.json(
      { message: "Campaign ID is required" },
      { status: 400 },
    );
  }

  try {
    // Use UTC dates throughout to avoid timezone mismatches
    const todayUTCStr = new Date().toISOString().split("T")[0];
    const todayUTC = new Date(todayUTCStr + "T00:00:00.000Z");

    const oneMonthAgo = new Date(todayUTC);
    oneMonthAgo.setUTCMonth(oneMonthAgo.getUTCMonth() - 1);

    const records = await prisma.campaignEmail.findMany({
      where: {
        campaignId: campaign,
        created: { gte: oneMonthAgo },
      },
      select: { created: true },
      orderBy: { created: "asc" },
    });

    // Group by UTC date
    const countsByDate = {};
    for (const record of records) {
      const date = record.created.toISOString().split("T")[0];
      if (date) {
        countsByDate[date] = (countsByDate[date] || 0) + 1;
      }
    }

    // Fill in every UTC day from one month ago to today (inclusive)
    const data = [];
    for (
      let d = new Date(oneMonthAgo);
      d <= todayUTC;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const key = d.toISOString().split("T")[0];
      data.push({ date: key, count: countsByDate[key] || 0 });
    }

    return NextResponse.json({ data, total: records.length });
  } catch (error) {
    console.error(
      `[API] Error getting leads growth for campaign ${campaign}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
