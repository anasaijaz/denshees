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
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    const records = await prisma.campaignEmail.findMany({
      where: {
        campaignId: campaign,
        created: { gte: oneMonthAgo },
      },
      select: { created: true },
      orderBy: { created: "asc" },
    });

    // Group by date
    const countsByDate = {};
    for (const record of records) {
      const date = record.created.toISOString().split("T")[0];
      if (date) {
        countsByDate[date] = (countsByDate[date] || 0) + 1;
      }
    }

    // Fill in every day from 1 month ago to today
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (
      let d = new Date(oneMonthAgo);
      d <= today;
      d.setDate(d.getDate() + 1)
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
