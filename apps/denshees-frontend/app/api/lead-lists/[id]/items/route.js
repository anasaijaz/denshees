import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const records = await prisma.leadListItem.findMany({
      where: { leadListId: id },
      orderBy: { created: "desc" },
    });

    return NextResponse.json({ items: records });
  } catch (error) {
    console.error(`[API] Error fetching items for list ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  const { id } = params;
  const { name, email, website, company, personalization } =
    await request.json();

  try {
    const record = await prisma.leadListItem.create({
      data: {
        leadListId: id,
        name: name || "",
        email: email || "",
        website: website || "",
        company: company || "",
        personalization: personalization || {},
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error(`[API] Error adding item to list ${id}:`, error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
