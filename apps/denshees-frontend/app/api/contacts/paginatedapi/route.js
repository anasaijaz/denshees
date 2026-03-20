import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const campaign = searchParams.get("campaign");
  const page = parseInt(searchParams.get("page") || "1");
  const searchString = searchParams.get("search") || "";
  const sentAtSort = searchParams.get("sentAtSort") || "NEWEST_FIRST";
  const stageFilter = searchParams.get("stage") || "ALL";
  const hideCompleted = searchParams.get("hideCompleted") === "true";
  const perPage = 15;

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

    const [items, totalItems] = await Promise.all([
      prisma.campaignEmail.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: { cred: { select: { username: true } } },
      }),
      prisma.campaignEmail.count({ where }),
    ]);

    // Reshape to match old format: put cred in expand
    const shapedItems = items.map((item) => {
      const { cred, ...rest } = item;
      return { ...rest, expand: { cred: cred || undefined } };
    });

    return NextResponse.json({
      items: shapedItems,
      totalItems,
      page,
      perPage,
      totalPages: Math.ceil(totalItems / perPage),
    });
  } catch (error) {
    console.error(
      `[API] Error getting paginated contacts for campaign ${campaign}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
