import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const records = await prisma.templateCampaign.findMany();
    return NextResponse.json(records);
  } catch (error) {
    console.error("[API] Error getting templates:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
