import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_STAGES = [
  {
    name: "Email Added",
    order: 0,
    color: "#6B7280",
    isWon: false,
    isLost: false,
  },
  {
    name: "LinkedIn Reached",
    order: 1,
    color: "#3B82F6",
    isWon: false,
    isLost: false,
  },
  {
    name: "Reply Received",
    order: 2,
    color: "#8B5CF6",
    isWon: false,
    isLost: false,
  },
  { name: "Meeting", order: 3, color: "#F59E0B", isWon: false, isLost: false },
  { name: "Deal Won", order: 4, color: "#10B981", isWon: true, isLost: false },
  { name: "No Reply", order: 5, color: "#EF4444", isWon: false, isLost: true },
  { name: "Deal Lost", order: 6, color: "#DC2626", isWon: false, isLost: true },
];

export async function POST(request) {
  const { campaign } = await request.json();

  if (!campaign) {
    return NextResponse.json(
      { message: "campaign is required" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.crmStage.findMany({
      where: { campaignId: campaign },
    });

    if (existing.length > 0) {
      return NextResponse.json(existing);
    }

    const created = [];
    for (const stage of DEFAULT_STAGES) {
      const record = await prisma.crmStage.create({
        data: { ...stage, campaignId: campaign },
      });
      created.push(record);
    }

    return NextResponse.json(created);
  } catch (error) {
    console.error("[API] Error seeding CRM stages:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
