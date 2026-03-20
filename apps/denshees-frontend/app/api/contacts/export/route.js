import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const campaign = searchParams.get("campaign");
  const searchString = searchParams.get("search") || "";
  const sentAtSort = searchParams.get("sentAtSort") || "NEWEST_FIRST";
  const stageFilter = searchParams.get("stage") || "ALL";
  const hideCompleted = searchParams.get("hideCompleted") === "true";

  try {
    const where = { campaignId: campaign };

    if (searchString) {
      where.OR = [
        { name: { contains: searchString, mode: "insensitive" } },
        { email: { contains: searchString, mode: "insensitive" } },
      ];
    }

    if (stageFilter !== "ALL") {
      where.stage = parseInt(stageFilter);
    }

    if (hideCompleted) {
      const campaignRecord = await prisma.campaign.findUnique({
        where: { id: campaign },
      });
      const maxStage = campaignRecord?.maxStageCount || 5;
      where.stage = { ...(where.stage || {}), lt: maxStage };
    }

    const orderBy =
      sentAtSort === "OLDEST_FIRST" ? { sentAt: "asc" } : { sentAt: "desc" };

    const records = await prisma.campaignEmail.findMany({ where, orderBy });

    return NextResponse.json({ items: records });
  } catch (error) {
    console.error(
      `[API] Error exporting contacts for campaign ${campaign}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
