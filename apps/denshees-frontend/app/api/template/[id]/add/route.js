import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const { stage, campaignId } = await request.json();

  try {
    const record = await prisma.pitchEmail.create({ data: {} });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { maxStageCount: { increment: 1 } },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("[API] Error adding template stage:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
