import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const deal = searchParams.get("deal");
  const campaign = searchParams.get("campaign");

  if (!deal && !campaign) {
    return NextResponse.json(
      { message: "deal or campaign is required" },
      { status: 400 },
    );
  }

  try {
    const where = deal ? { dealId: deal } : { campaignId: campaign };

    const records = await prisma.crmActivity.findMany({
      where,
      orderBy: { created: "desc" },
      include: { fromStage: true, toStage: true },
    });

    const shaped = records.map(({ fromStage, toStage, ...rest }) => ({
      ...rest,
      expand: { from_stage: fromStage, to_stage: toStage },
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("[API] Error getting CRM activities:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const body = await request.json();

  try {
    const record = await prisma.crmActivity.create({
      data: {
        dealId: body.deal,
        campaignId: body.campaign,
        type: body.type,
        description: body.description,
        fromStageId: body.from_stage,
        toStageId: body.to_stage,
      },
      include: { fromStage: true, toStage: true },
    });

    const { fromStage, toStage, ...rest } = record;
    return NextResponse.json({
      ...rest,
      expand: { from_stage: fromStage, to_stage: toStage },
    });
  } catch (error) {
    console.error("[API] Error creating CRM activity:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
