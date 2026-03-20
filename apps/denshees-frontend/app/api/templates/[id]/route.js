import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const id = params.id;

  try {
    const record = await prisma.templateCampaign.findUnique({
      where: { id },
      include: { pitches: { orderBy: { stage: "asc" } } },
    });

    // Reshape to match old expand format
    if (record) {
      record.expand = {
        template_campaign_pitches_via_campaign_template: record.pitches,
      };
      delete record.pitches;
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[API] Error getting template ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
