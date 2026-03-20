import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const campaign = searchParams.get("campaign");

  try {
    const records = await prisma.campaignEmail.findMany({
      where: { campaignId: campaign },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error(
      `[API] Error getting all contacts for campaign ${campaign}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
