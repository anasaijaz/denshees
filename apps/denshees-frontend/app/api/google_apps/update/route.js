import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request) {
  try {
    const data = await request.json();

    await prisma.emailCredential.update({
      where: { id: data.id },
      data: { dailyLimit: data.dailyLimit },
    });

    return NextResponse.json({ message: "Data received", receivedData: data });
  } catch (error) {
    console.error("[API] Error updating Google app settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
