import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const { contacts, campaign } = await request.json();

  try {
    const created = await prisma.campaignEmail.createMany({
      data: contacts.map((c) => ({
        name: c.name,
        email: c.email,
        campaignId: campaign,
        status: "PENDING",
        sentAt: new Date(),
        opened: 0,
        stage: 0,
        personalization: c.personalization || undefined,
      })),
    });

    return NextResponse.json({
      message: "Contacts imported",
      count: created.count,
    });
  } catch (error) {
    console.error(
      `[API] Error importing contacts for campaign ${campaign}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
