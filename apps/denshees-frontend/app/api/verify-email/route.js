import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const token = request.headers.get("authorization");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const decoded = jwtDecode(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { millionVerifierApiKey: true },
    });

    if (!user?.millionVerifierApiKey) {
      return NextResponse.json(
        { error: "MillionVerifier API key not configured" },
        { status: 403 },
      );
    }

    const url = `https://api.millionverifier.com/api/v3/?api=${encodeURIComponent(user.millionVerifierApiKey)}&email=${encodeURIComponent(email)}&timeout=10`;
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Verification service error" },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 },
    );
  }
}
