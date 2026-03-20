import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const { itemId } = params;
  const { name, email, website, company, personalization } =
    await request.json();

  try {
    const record = await prisma.leadListItem.update({
      where: { id: itemId },
      data: { name, email, website, company, personalization },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[API] Error updating item ${itemId}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { itemId } = params;

  try {
    await prisma.leadListItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(`[API] Error deleting item ${itemId}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
