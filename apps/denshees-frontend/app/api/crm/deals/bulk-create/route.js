import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const { campaign, defaultStageId } = await request.json();

  if (!campaign || !defaultStageId) {
    return NextResponse.json(
      { message: "campaign and defaultStageId are required" },
      { status: 400 },
    );
  }

  try {
    const leads = await prisma.campaignEmail.findMany({
      where: { campaignId: campaign },
    });

    const existingDeals = await prisma.crmDeal.findMany({
      where: { campaignId: campaign },
    });

    const existingLeadIds = new Set(existingDeals.map((d) => d.leadId));

    const created = [];
    for (const lead of leads) {
      if (!existingLeadIds.has(lead.id)) {
        const record = await prisma.crmDeal.create({
          data: {
            leadId: lead.id,
            campaignId: campaign,
            stageId: defaultStageId,
          },
          include: { lead: true, stage: true },
        });
        const { lead: dealLead, stage, ...rest } = record;
        created.push({
          ...rest,
          stage: rest.stageId,
          expand: { lead: dealLead, stage },
        });
      }
    }

    return NextResponse.json({
      created: created.length,
      total: leads.length,
      deals: created,
    });
  } catch (error) {
    console.error("[API] Error bulk creating CRM deals:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
