import { NextResponse } from "next/server";
import { tasks, auth } from "@trigger.dev/sdk";

export async function POST(request, { params }) {
  try {
    const { id: listId } = params;
    const body = await request.json();
    const { leads } = body;

    if (!listId) {
      return NextResponse.json(
        { error: "listId is required" },
        { status: 400 },
      );
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "leads array is required and must not be empty" },
        { status: 400 },
      );
    }

    // Create a unique tag for this run so the client can subscribe to realtime updates
    const tag = `add-leads-${listId}-${Date.now()}`;

    const handle = await tasks.trigger(
      "add-lead-to-list",
      { listId, leads },
      { tags: [tag] },
    );

    // Generate a public access token scoped to this run's tag
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          tags: [tag],
        },
      },
      expirationTime: "1hr",
    });

    return NextResponse.json({
      runId: handle.id,
      tag,
      publicToken,
    });
  } catch (error) {
    console.error("[API] lead-lists/add-leads error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to trigger add leads task" },
      { status: 500 },
    );
  }
}
