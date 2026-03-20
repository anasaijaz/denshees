import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const records = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        created: true,
        updated: true,
      },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("[API] Error getting users:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
