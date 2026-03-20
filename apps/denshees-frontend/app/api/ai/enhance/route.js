import { openai } from "@/lib/openai";
import prisma from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";

export async function POST(request) {
  console.log("[API] Processing text enhancement request");

  const { text, type = "GRAMMAR" } = await request.json();

  if (!text) {
    console.error("[API] No text provided for enhancement");
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  try {
    const token = request.headers.get("authorization");
    const currUser = jwtDecode(token);
    console.log(
      `[API] Processing enhancement request for user: ${currUser.userId}, type: ${type}`,
    );

    const user = await prisma.user.findUnique({
      where: { id: currUser.userId },
    });

    if (!user) {
      console.error("[API] User not found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Send request to OpenAI API for text enhancement
    console.log(`[API] Sending enhancement request to OpenAI, type: ${type}`);

    const prompts = {
      POLITE:
        "Provided is the email that I am writing. Just make it more POLITE, that's it. Keep the context same, without changing it much, and preserve any HTML formatting or placeholders like {{name}}. Keep it as humane as possible, using simple english words.",
      GRAMMAR:
        "Provided is the email that I am writing. Just correct the GRAMMATICAL MISTAKES if any, that's it, preserving any HTML formatting or placeholders like {{name}.",

      PROFESSIONAL:
        "Provided is the email that I am writing. Just make sure it sounds PROFESSIONAL, that's it. Keep the context same, without changing it much, and preserve any HTML formatting or placeholders like {{name}. Keep it as humane as possible, using simple english words.",

      INFORMAL:
        "Provided is the email that I am writing. Just make sure it sounds Informal and friendly, that's it. Keep the context same, without changing it much, and preserve any HTML formatting or placeholders like {{name}. Keep it as humane as possible, using simple english words.",

      HUMOUR:
        "Provided is the email that I am writing. Just add little, subtle HUMOR, wherever possible, that's it. Keep the context same, without changing it much, and preserve any HTML formatting or placeholders like {{name}. Keep it as humane as possible, using simple english words.",
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: prompts[type],
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    console.log(`[API] Decreasing AI credits for user: ${currUser.userId}`);
    await prisma.user.update({
      where: { id: currUser.userId },
      data: { aiCredits: { decrement: 1 } },
    });

    const enhancedText = response.choices[0].message.content;
    console.log("[API] Text enhancement completed successfully");
    return NextResponse.json({ enhancedText });
  } catch (error) {
    console.error("[API] Error enhancing text:", error);
    return NextResponse.json(
      { error: "Failed to enhance text" },
      { status: 500 },
    );
  }
}
