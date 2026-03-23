import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/agent/threads — list all chat threads for the current user
export async function GET(request) {
  try {
    const token = request.headers.get("authorization");
    const currUser = jwtDecode(token);
    if (!currUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get distinct threadIds with latest message date
    const threads = await prisma.agentChatMessage.groupBy({
      by: ["threadId"],
      where: { userId: currUser.userId },
      _max: { created: true },
      _min: { created: true },
      orderBy: { _max: { created: "desc" } },
    });

    // For each thread, get the first user message as preview
    const threadIds = threads.map((t) => t.threadId);
    const previews = await prisma.agentChatMessage.findMany({
      where: {
        userId: currUser.userId,
        threadId: { in: threadIds },
        role: "user",
      },
      orderBy: { created: "asc" },
      distinct: ["threadId"],
      select: { threadId: true, content: true },
    });

    const previewMap = Object.fromEntries(
      previews.map((p) => [p.threadId, p.content]),
    );

    return NextResponse.json({
      threads: threads.map((t) => ({
        threadId: t.threadId,
        preview: previewMap[t.threadId]?.slice(0, 100) || "New conversation",
        lastMessage: t._max.created,
        startedAt: t._min.created,
      })),
    });
  } catch (error) {
    console.error("[API] Error listing threads:", error);
    return NextResponse.json(
      { error: "Failed to list threads" },
      { status: 500 },
    );
  }
}
