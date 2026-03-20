import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { customer_id, email, creditType, quantity, payment_id, action } =
      body;

    // Validate required fields
    if (!email || !creditType || !quantity || !payment_id || !action) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: email, creditType, quantity, payment_id, action",
        },
        { status: 400 },
      );
    }

    // Validate credit type
    if (!["email", "ai"].includes(creditType)) {
      return NextResponse.json(
        { error: 'Invalid creditType. Must be "email" or "ai"' },
        { status: 400 },
      );
    }

    // Validate action
    if (!["add", "subtract"].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "add" or "subtract"' },
        { status: 400 },
      );
    }

    console.log(
      `${
        action === "add" ? "Adding" : "Subtracting"
      } ${quantity} ${creditType} credits for ${email}`,
    );

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: `User not found with email: ${email}` },
        { status: 404 },
      );
    }

    const currentCredits =
      creditType === "email" ? user.credits || 0 : user.aiCredits || 0;
    const newCredits =
      action === "add"
        ? currentCredits + quantity
        : Math.max(0, currentCredits - quantity);

    const updateData =
      creditType === "email"
        ? { credits: newCredits }
        : { aiCredits: newCredits };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    const updateResult = {
      success: true,
      customer_id,
      email,
      creditType,
      quantity,
      action,
      payment_id,
      previousCredits: currentCredits,
      newCredits:
        creditType === "email" ? updatedUser.credits : updatedUser.aiCredits,
      updatedAt: new Date().toISOString(),
    };

    console.log("Credit update result:", updateResult);

    return NextResponse.json({
      success: true,
      message: `Successfully ${
        action === "add" ? "added" : "subtracted"
      } ${quantity} ${creditType} credits`,
      data: updateResult,
    });
  } catch (error) {
    console.error("Credit update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update credits",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to update credits." },
    { status: 405 },
  );
}
