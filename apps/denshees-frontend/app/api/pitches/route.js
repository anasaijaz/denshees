import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const campaign = searchParams.get("campaign");

  try {
    const [items, totalItems] = await Promise.all([
      prisma.pitchEmail.findMany({
        where: { campaignId: campaign },
        orderBy: { stage: "asc" },
        take: 25,
      }),
      prisma.pitchEmail.count({ where: { campaignId: campaign } }),
    ]);

    return NextResponse.json({ items, totalItems, page: 1, perPage: 25 });
  } catch (error) {
    console.error(
      `[API] Error getting pitches for campaign ${campaign}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
