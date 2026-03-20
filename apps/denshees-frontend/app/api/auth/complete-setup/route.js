import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const token = request.headers.get("authorization");

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwtDecode(token);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isSetup: true },
    });

    return NextResponse.json({ message: "Setup complete" });
  } catch (error) {
    console.error("Error completing setup:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
