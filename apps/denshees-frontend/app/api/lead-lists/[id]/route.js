import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const record = await prisma.leadList.findUnique({ where: { id } });
    return NextResponse.json(record);
  } catch (error) {
    console.error(`[API] Error fetching lead list ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  const { id } = params;
  const { name, description } = await request.json();

  try {
    const record = await prisma.leadList.update({
      where: { id },
      data: { name, description },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[API] Error updating lead list ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.leadList.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(`[API] Error deleting lead list ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
