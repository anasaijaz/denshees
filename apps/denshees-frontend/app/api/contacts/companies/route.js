import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const campaign = searchParams.get("campaign");

  if (!campaign) {
    return NextResponse.json(
      { message: "Campaign ID is required" },
      { status: 400 },
    );
  }

  try {
    const records = await prisma.campaignEmail.findMany({
      where: { campaignId: campaign },
      select: { email: true },
    });

    // Aggregate by domain
    const domainMap = {};
    for (const record of records) {
      const email = record.email;
      if (email && email.includes("@")) {
        const domain = email.split("@")[1]?.toLowerCase();
        if (domain) {
          const companyName = domain.split(".")[0];
          if (!domainMap[companyName]) {
            domainMap[companyName] = { name: companyName, domain, count: 0 };
          }
          domainMap[companyName].count += 1;
        }
      }
    }

    const companies = Object.values(domainMap).sort(
      (a, b) => b.count - a.count,
    );

    return NextResponse.json(companies);
  } catch (error) {
    console.error(
      `[API] Error getting companies for campaign ${campaign}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
