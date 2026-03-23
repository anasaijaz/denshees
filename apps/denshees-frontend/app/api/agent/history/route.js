import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/agent/history?thread_id=xxx — load chat history for a thread
export async function GET(request) {
  try {
    const token = request.headers.get("authorization");
    const currUser = jwtDecode(token);
    if (!currUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threadId = new URL(request.url).searchParams.get("thread_id");
    if (!threadId) {
      return NextResponse.json(
        { error: "thread_id is required" },
        { status: 400 },
      );
    }

    const messages = await prisma.agentChatMessage.findMany({
      where: { userId: currUser.userId, threadId },
      orderBy: { created: "asc" },
      select: { role: true, content: true, toolName: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[API] Error loading chat history:", error);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 },
    );
  }
}

// POST /api/agent/history — save one or more messages
export async function POST(request) {
  try {
    const token = request.headers.get("authorization");
    const currUser = jwtDecode(token);
    if (!currUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { thread_id, messages } = await request.json();
    if (!thread_id || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "thread_id and messages[] are required" },
        { status: 400 },
      );
    }

    await prisma.agentChatMessage.createMany({
      data: messages.map((m) => ({
        threadId: thread_id,
        userId: currUser.userId,
        role: m.role,
        content: m.content || "",
        toolName: m.toolName || null,
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] Error saving chat messages:", error);
    return NextResponse.json(
      { error: "Failed to save chat messages" },
      { status: 500 },
    );
  }
}
