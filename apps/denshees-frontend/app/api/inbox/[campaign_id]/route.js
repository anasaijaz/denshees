import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const campaign = params.campaign_id;

  try {
    const records = await prisma.campaignMessage.findMany({
      where: {
        sent: false,
        campaignEmail: { campaignId: campaign },
      },
      orderBy: { created: "desc" },
      include: { campaignEmail: true },
    });

    // Reshape to match old expand format
    const shaped = records.map(({ campaignEmail, ...rest }) => ({
      ...rest,
      expand: { campaign_email: campaignEmail },
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error(`[API] Error getting inbox for campaign ${campaign}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
