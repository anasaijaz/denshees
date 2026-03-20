import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 0;

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const campaignEmailCreds = await prisma.campaignEmailCredential.findMany({
      where: { campaignId: id },
      include: { emailCredential: true },
    });

    const emails = campaignEmailCreds.map((cec) => cec.emailCredential);
    return NextResponse.json(emails);
  } catch (error) {
    console.error(
      `[API] Error getting selected emails for campaign ${id}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
