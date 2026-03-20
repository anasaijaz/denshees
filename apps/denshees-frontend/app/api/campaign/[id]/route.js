import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const record = await prisma.campaign.findUnique({
      where: { id },
      include: { campaignEmailCredentials: { include: { emailCredential: true } } },
    });

    if (!record) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[API] Error getting campaign ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  const { id } = params;
  const {
    setuped,
    title,
    max_stage_count,
    days_interval,
    desc,
    status,
    ignore_verification,
    deleted,
    emails,
    isTrackingEnabled,
    active_days,
    email_delivery_period,
  } = await request.json();

  try {
    const data = {};
    if (setuped !== undefined) data.setuped = setuped;
    if (title !== undefined) data.title = title;
    if (max_stage_count !== undefined) data.maxStageCount = max_stage_count;
    if (days_interval !== undefined) data.daysInterval = days_interval;
    if (desc !== undefined) data.desc = desc;
    if (status !== undefined) data.status = status;
    if (ignore_verification !== undefined)
      data.ignoreVerification = ignore_verification;
    if (deleted !== undefined) data.deleted = deleted;
    if (isTrackingEnabled !== undefined)
      data.isTrackingEnabled = isTrackingEnabled;
    if (active_days !== undefined) data.activeDays = active_days;
    if (email_delivery_period !== undefined)
      data.emailDeliveryPeriod = email_delivery_period;

    const record = await prisma.campaign.update({
      where: { id },
      data,
    });

    // Handle multi-relation emails update
    if (emails !== undefined && Array.isArray(emails)) {
      await prisma.campaignEmailCredential.deleteMany({
        where: { campaignId: id },
      });
      for (const credId of emails) {
        await prisma.campaignEmailCredential.create({
          data: { campaignId: id, emailCredentialId: credId },
        });
      }
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[API] Error updating campaign ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
