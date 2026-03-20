import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const dealId = params.id;
  const body = await request.json();

  try {
    const data = {};
    if (body.lead !== undefined) data.leadId = body.lead;
    if (body.campaign !== undefined) data.campaignId = body.campaign;
    if (body.stage !== undefined) data.stageId = body.stage;

    const record = await prisma.crmDeal.update({
      where: { id: dealId },
      data,
      include: { lead: true, stage: true },
    });

    const { lead, stage, ...rest } = record;
    return NextResponse.json({
      ...rest,
      stage: rest.stageId,
      expand: { lead, stage },
    });
  } catch (error) {
    console.error(`[API] Error updating CRM deal ${dealId}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const dealId = params.id;

  try {
    await prisma.crmDeal.delete({ where: { id: dealId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[API] Error deleting CRM deal ${dealId}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
