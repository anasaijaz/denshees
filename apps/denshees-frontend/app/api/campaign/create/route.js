import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const { title, max_stage_count, days_interval, desc, email_delivery_period } =
    await request.json();
  const token = request.headers.get("authorization");
  const user = jwtDecode(token);

  try {
    const campaign = await prisma.campaign.create({
      data: {
        title,
        userId: user.userId,
        maxStageCount: max_stage_count,
        daysInterval: days_interval,
        desc,
        emailDeliveryPeriod: email_delivery_period,
        status: "PENDING",
        setuped: false,
      },
    });

    const subject_1 = "You should check this out {{name}}!";
    const first_pitch =
      "Hey {{name}}, I am reaching out to you for the first time. Looking forward to your reply.";
    const later_pitches =
      "Hey {{name}}, I am just following up on my previous emails.";
    const follow_up_subject = "Following Up {{name}}!";

    await prisma.pitchEmail.create({
      data: {
        title: "First Reach out",
        message: first_pitch,
        subject: subject_1,
        campaignId: campaign.id,
        stage: 0,
      },
    });

    if (max_stage_count > 1) {
      for (let i = 1; i < max_stage_count; i++) {
        await prisma.pitchEmail.create({
          data: {
            title: `Follow Up ${i}`,
            message: later_pitches,
            subject: follow_up_subject,
            campaignId: campaign.id,
            stage: i,
          },
        });
      }
    }

    return NextResponse.json({ message: "Campaign created", campaign });
  } catch (error) {
    console.error("[API] Error creating campaign:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
