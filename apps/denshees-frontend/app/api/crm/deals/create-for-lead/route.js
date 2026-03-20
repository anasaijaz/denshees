import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const { campaign, email, stageId } = await request.json();

  if (!campaign || !email || !stageId) {
    return NextResponse.json(
      { message: "campaign, email, and stageId are required" },
      { status: 400 },
    );
  }

  try {
    const lead = await prisma.campaignEmail.findFirst({
      where: { campaignId: campaign, email },
      orderBy: { created: "desc" },
    });

    if (!lead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    const existingDeal = await prisma.crmDeal.findFirst({
      where: { leadId: lead.id },
    });

    if (existingDeal) {
      return NextResponse.json(existingDeal);
    }

    const deal = await prisma.crmDeal.create({
      data: {
        leadId: lead.id,
        campaignId: campaign,
        stageId,
      },
      include: { lead: true, stage: true },
    });

    const { lead: dealLead, stage, ...rest } = deal;
    return NextResponse.json({
      ...rest,
      stage: rest.stageId,
      expand: { lead: dealLead, stage },
    });
  } catch (error) {
    console.error("[API] Error creating deal for lead:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
