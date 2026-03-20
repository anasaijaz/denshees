import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  console.log("[API] Creating campaign from template");

  const {
    title,
    max_stage_count,
    days_interval,
    desc,
    email_delivery_period,
    serviceType = "GENERAL_SERVICES",
  } = await request.json();
  const token = request.headers.get("authorization");
  const user = jwtDecode(token);

  try {
    console.log({
      title,
      max_stage_count,
      days_interval,
      desc,
      email_delivery_period,
      serviceType,
    });

    if (
      !title ||
      !max_stage_count ||
      !days_interval ||
      !desc ||
      !email_delivery_period ||
      !serviceType
    ) {
      console.error("[API] Missing required fields for campaign creation");
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 },
      );
    }

    console.log(
      `[API] Creating campaign for user: ${user.userId}, title: ${title}, service type: ${serviceType}`,
    );
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

    const subject_1 = "I have a quick question, mind if I ask {{name}} ?";

    const pitches = {
      first_pitch: {
        WEBSITE_DESIGN:
          '<p>Hey {{name}},</p><p>I was searching for dentists in LA and I found your ad on Google.</p><p>I saw your website, found few things that might be ruining your conversions.</p><p>I created this report for you that can help boost sales.</p><p>Whom do I send it to?</p><p><strong>Please respond with a quick "No" if you don\'t want it.</strong></p><p>Take Care</p>',
        SEO: '<p>I was searching for dentists in LA and I found you are running ads.</p><p>I am an SEO expert and have been in the industry for X years.</p><p>I have helped 10+ clients rank on dentist-related keywords on Google in New York.</p><p>Let me know if you want to see my case studies.</p><p><strong>Please respond with a quick "No" if you don\'t want to be messaged again.</strong></p><p>Take Care</p>',
        VIDEO_EDITING:
          '<p>Hey {{name}},</p><p>Youtube recommended me one of your videos, you post awesome stuff.</p><p>Btw, I was wondering do you guys need a video editor and youtube growth strategist who works specifically with Dental clinics?</p><p>Is this something you are considering?</p><p><strong>LET ME KNOW IF YOU WANT TO SEE MY WORK SAMPLES!</strong></p><p>If not, reply with "NO" and I will remove you from my follow up list!</p><p>Keep creating content!</p>',
        GENERAL_SERVICES:
          "<p>Hey {{name}},</p><p>I was looking at your online presence and noticed a few areas that might benefit from some improvements.</p><p>I specialize in helping businesses like yours enhance their digital strategies to boost engagement and drive results.</p><p>I'd love to share some insights and ideas that could help elevate your online impact.</p><p>Whom can I send it to?</p><p><strong>Please respond with a quick \"No\" if you're not interested.</strong></p><p>Looking forward to connecting!</p>",
      },
      later_pitches: {
        1: "<p>Hi,</p><p>Did you read my previous email?</p><p>I'm writing to follow up on my previous email regarding some suggestions on YouTube growth and hiring for a freelance video editor/thumbnail designer.</p><p>I didn't hear back from you or anyone on your team.</p><p>If it makes sense to talk further, let me know how your calendar looks for the next few weeks for a 5-10 minute call.</p><p>If not, who is the appropriate person for me to speak to?</p><p>Thanks for your help.</p><p>Looking forward to hearing from you!</p>",
        2: "<p>Hey!</p><p>I know you're busy; just wanted to make sure this didn't get buried.</p><p>In case you are not interested, just reply with \"NO\" so I don't follow up again.</p><p>Thanks! Have a great day.</p>",
        3: "<p>Hi,</p><p>Just wanted to check in and see if you had a chance to review my previous emails.</p><p>Let me know if you have any questions or if you would like to discuss further.</p><p>Thanks!</p>",
        4: "<p>Hey,</p><p>Any updates on this?</p><p>I hope I am not bothering you with my emails.</p><p>Let me know if you are not interested.</p><p>Thanks!</p>",
        5: "<p>Hi,</p><p>Just wanted to check in for one last time.</p><p>Sorry, If I bothered you with my emails.</p><p>Thanks for your time!</p>",
      },
    };

    console.log(`[API] Creating first pitch for campaign: ${campaign.id}`);
    const data_first_reachout = {
      title: "First Reach Out",
      message: pitches.first_pitch[serviceType],
      subject: subject_1,
      campaign: campaign.id,
      stage: 0,
    };

    await prisma.pitchEmail.create({
      data: {
        title: data_first_reachout.title,
        message: data_first_reachout.message,
        subject: data_first_reachout.subject,
        campaignId: data_first_reachout.campaign,
        stage: data_first_reachout.stage,
      },
    });

    if (max_stage_count > 1) {
      console.log(`[API] Creating ${max_stage_count - 1} follow-up pitches`);
      for (let i = 1; i < max_stage_count; i++) {
        const data_followup = {
          title: `Follow Up ${i}`,
          message: pitches.later_pitches[i],
          subject: subject_1,
          campaign: campaign.id,
          stage: i,
        };
        await prisma.pitchEmail.create({
          data: {
            title: data_followup.title,
            message: data_followup.message,
            subject: data_followup.subject,
            campaignId: data_followup.campaign,
            stage: data_followup.stage,
          },
        });
      }
    }

    console.log(
      `[API] Campaign created successfully from template: ${campaign.id}`,
    );
    return NextResponse.json({ message: "Campaign created", campaign });
  } catch (error) {
    console.error("[API] Error creating campaign from template:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 401 },
    );
  }
}
