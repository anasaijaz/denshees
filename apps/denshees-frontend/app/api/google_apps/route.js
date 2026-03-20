import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const token = request.headers.get("authorization");

  try {
    const user = jwtDecode(token);
    const records = await prisma.emailCredential.findMany({
      where: { userId: user.userId },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[API] Error getting email credentials:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
