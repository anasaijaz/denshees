import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const token = request.headers.get("authorization");

  try {
    const auth = jwtDecode(token);

    const record = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        credits: true,
        aiCredits: true,
        isSetup: true,
        created: true,
        updated: true,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("[API] Error getting current user:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
