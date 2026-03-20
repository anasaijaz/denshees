import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request) {
  const token = request.headers.get("authorization");
  const { name, username } = await request.json();

  try {
    const auth = jwtDecode(token);

    await prisma.user.update({
      where: { id: auth.userId },
      data: { name, username },
    });

    return NextResponse.json({ message: "Account updated" });
  } catch (error) {
    console.error("[API] Error updating account:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 400 },
    );
  }
}
