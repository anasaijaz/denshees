import { NextResponse } from "next/server";
import Papa from "papaparse";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const campaign = formData.get("campaign");

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 },
      );
    }

    const content = await file.text();

    const jsonData = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
    });

    const contacts = jsonData.data;

    const created = await prisma.campaignEmail.createMany({
      data: contacts.map((c) => ({
        name: c.name,
        email: c.email,
        campaignId: campaign,
        status: "PENDING",
        verified: "PENDING",
        sentAt: new Date(),
        opened: 0,
        stage: 0,
        personalization: c.personalization
          ? typeof c.personalization === "string"
            ? JSON.parse(c.personalization)
            : c.personalization
          : undefined,
      })),
    });

    return NextResponse.json({
      message: "Contacts imported",
      count: created.count,
    });
  } catch (error) {
    console.error("[API] Error importing contacts from file:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
