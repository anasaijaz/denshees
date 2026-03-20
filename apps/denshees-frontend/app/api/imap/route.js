import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request) {
  const searchParams = new URL(request.url).searchParams;
  const pitch = searchParams.get("pitch");
  const { message, subject } = await request.json();

  try {
    const record = await prisma.pitchEmail.update({
      where: { id: pitch },
      data: { message, subject },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[API] Error updating pitch ${pitch}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
