"""FastAPI server exposing the LangGraph ReAct agent."""

import json

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from pydantic import BaseModel

from langsmith import traceable

from src.agent import graph
from src.state import AgentState

app = FastAPI(title="Denshees Agents", version="0.1.0")


class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default"
    auth_token: str


# ── Streaming endpoint ──────────────────────────────────────


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    config = {"configurable": {"thread_id": req.thread_id, "auth_token": req.auth_token}}
    input_state = AgentState(messages=[HumanMessage(content=req.message)])

    async def generate():
        try:
            async for event in graph.astream_events(
                input_state, config=config, version="v2"
            ):
                kind = event["event"]

                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    if isinstance(chunk.content, str) and chunk.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

                elif kind == "on_tool_start":
                    yield f"data: {json.dumps({'type': 'tool_start', 'name': event['name']})}\n\n"

                elif kind == "on_tool_end":
                    output = str(event["data"].get("output", ""))
                    yield f"data: {json.dumps({'type': 'tool_end', 'name': event['name'], 'output': output})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Non-streaming endpoint (kept for backward compat) ───────


class Step(BaseModel):
    type: str  # "human" | "assistant" | "tool"
    content: str
    tool_calls: list[dict] | None = None
    tool_name: str | None = None


class ChatResponse(BaseModel):
    reply: str
    steps: list[Step]


@app.post("/chat", response_model=ChatResponse)
@traceable(name="chat_endpoint")
async def chat(req: ChatRequest) -> ChatResponse:
    config = {"configurable": {"thread_id": req.thread_id, "auth_token": req.auth_token}}
    result = await graph.ainvoke(
        AgentState(messages=[HumanMessage(content=req.message)]),
        config=config,
    )

    steps: list[Step] = []
    reply = ""
    for msg in result["messages"]:
        if isinstance(msg, HumanMessage):
            steps.append(Step(type="human", content=str(msg.content)))
        elif isinstance(msg, AIMessage):
            step = Step(type="assistant", content=str(msg.content))
            if msg.tool_calls:
                step.tool_calls = [
                    {"name": tc["name"], "args": tc["args"]} for tc in msg.tool_calls
                ]
            steps.append(step)
            if msg.content:
                reply = str(msg.content)
        elif isinstance(msg, ToolMessage):
            steps.append(Step(type="tool", content=str(msg.content), tool_name=msg.name))

    return ChatResponse(reply=reply, steps=steps)


@app.get("/health")
async def health():
    return {"status": "ok"}
