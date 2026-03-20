import Hogan from "hogan.js";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  console.log(`[API] Getting timeline for lead: ${params.id}`);

  const campaign_email_id = params.id;

  try {
    console.log(`[API] Fetching messages for lead: ${campaign_email_id}`);
    const messages = await prisma.campaignMessage.findMany({
      where: { campaignEmailId: campaign_email_id },
      include: {
        pitch: true,
        campaignEmail: true,
      },
    });

    console.log(`[API] Fetching opens for lead: ${campaign_email_id}`);
    const opens = await prisma.campaignOpen.findMany({
      where: { campaignEmailId: campaign_email_id },
    });

    const leadTimeline = {
      messagesSent: messages
        .filter((msg) => msg.sent === true)
        .map((msg) => {
          const subjectTemplate = Hogan.compile(msg.pitch.subject);
          const bodyTemplate = Hogan.compile(msg.pitch.message);

          return {
            date: new Date(msg.created),
            subject: subjectTemplate.render({
              name: msg.campaignEmail.name,
            }),
            body: bodyTemplate.render({
              name: msg.campaignEmail.name,
            }),
          };
        }),
      messagesOpened: opens.map((open) => ({
        date: new Date(open.created),
      })),
      replies: messages
        .filter((msg) => msg.sent === false)
        .map((msg) => ({
          date: new Date(msg.created),
          message: msg.text,
        })),
    };

    console.log(
      `[API] Successfully built timeline for lead: ${campaign_email_id}`,
    );
    return NextResponse.json(leadTimeline);
  } catch (error) {
    console.error(
      `[API] Error getting timeline for lead ${campaign_email_id}:`,
      error,
    );
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 401 },
    );
  }
}
