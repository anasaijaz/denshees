import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const { stage, campaignId } = await request.json();
  const { id } = params;

  try {
    await prisma.pitchEmail.delete({ where: { id } });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { maxStageCount: { decrement: 1 } },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(`[API] Error deleting template stage ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
