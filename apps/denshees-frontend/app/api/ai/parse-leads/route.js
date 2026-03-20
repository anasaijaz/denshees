import { openai } from "@/lib/openai";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a lead extraction assistant. The user will describe leads they want to add to a list. 
Extract structured lead data from their message.

Return a JSON object with this shape:
{
  "leads": [
    {
      "name": "Full Name",
      "email": "email@example.com",
      "company": "Company Name (if mentioned)",
      "website": "website url (if mentioned)",
      "personalization": { "key": "value" } // any extra info like job title, department, etc.
    }
  ],
  "message": "A brief confirmation message describing what you extracted or changed"
}

Rules:
- Extract as many leads as the user describes
- If the user provides partial info (e.g. just names and a company), fill in what you can and leave email empty
- If you can infer a company domain from context, add it as website
- The personalization object should capture any extra details like job title, department, role, notes etc.
- If the user asks to correct, update, edit, change, or remove specific leads from the current list, apply those changes to the existing leads and return the FULL updated list
- When editing, pay attention to ordinal references like "the second lead", "lead #3", "the last one" etc.
- If the user message doesn't seem to be about adding or editing leads, return {"leads": [], "message": "I can only help with adding leads to your list. Please describe the leads you'd like to add."}
- Always return valid JSON only, no markdown fences`;

export async function POST(request) {
  try {
    const {
      message,
      conversationHistory = [],
      currentLeads = null,
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
    ];

    // Inject current leads context so the AI can reference them for edits
    if (currentLeads && currentLeads.length > 0) {
      messages.push({
        role: "system",
        content: `Current pending leads (user may want to edit these):\n${JSON.stringify(currentLeads, null, 2)}`,
      });
    }

    messages.push({ role: "user", content: message });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[API] ai/parse-leads error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse leads" },
      { status: 500 },
    );
  }
}
