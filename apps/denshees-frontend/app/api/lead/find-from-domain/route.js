import { NextResponse } from "next/server";
import { tasks, auth } from "@trigger.dev/sdk";

export async function POST(request) {
  try {
    const body = await request.json();
    const { domain, filters, size } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 },
      );
    }

    // Create a unique tag for this run so the client can subscribe to realtime updates
    const tag = `lead-finder-${domain}-${Date.now()}`;

    const handle = await tasks.trigger(
      "find-leads-from-domain",
      { domain, filters, size },
      { tags: [tag] },
    );

    console.log(handle);

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
    console.error("[API] lead/find-from-domain error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to trigger lead finder" },
      { status: 500 },
    );
  }
}
