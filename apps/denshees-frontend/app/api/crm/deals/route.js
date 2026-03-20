import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const campaign = searchParams.get("campaign");
  const stage = searchParams.get("stage");

  if (!campaign) {
    return NextResponse.json(
      { message: "campaign is required" },
      { status: 400 },
    );
  }

  try {
    const where = { campaignId: campaign };
    if (stage) where.stageId = stage;

    const records = await prisma.crmDeal.findMany({
      where,
      orderBy: { created: "desc" },
      include: { lead: true, stage: true },
    });

    // Reshape to match old expand format
    const shaped = records.map(({ lead, stage, ...rest }) => ({
      ...rest,
      stage: rest.stageId,
      expand: { lead, stage },
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("[API] Error getting CRM deals:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const body = await request.json();

  try {
    const record = await prisma.crmDeal.create({
      data: {
        leadId: body.lead,
        campaignId: body.campaign,
        stageId: body.stage,
      },
      include: { lead: true, stage: true },
    });

    const { lead, stage, ...rest } = record;
    return NextResponse.json({
      ...rest,
      stage: rest.stageId,
      expand: { lead, stage },
    });
  } catch (error) {
    console.error("[API] Error creating CRM deal:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
