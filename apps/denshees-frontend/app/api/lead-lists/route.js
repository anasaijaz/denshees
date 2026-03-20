import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const token = request.headers.get("authorization");

  try {
    const user = jwtDecode(token);
    const records = await prisma.leadList.findMany({
      where: { userId: user.userId },
      orderBy: { created: "desc" },
    });

    return NextResponse.json({ items: records });
  } catch (error) {
    console.error("[API] Error fetching lead lists:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const token = request.headers.get("authorization");
  const { name, description } = await request.json();
  const user = jwtDecode(token);

  try {
    const record = await prisma.leadList.create({
      data: {
        name,
        description: description || "",
        userId: user.userId,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("[API] Error creating lead list:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
