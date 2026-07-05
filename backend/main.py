from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

import ollama_client as llm
from tools import TOOL_SCHEMAS, build_tool_prompt, parse_tool_call, run_tool
import memory_store as mem
from planner import run_react_loop

app = FastAPI(title="Agent Loop Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return await llm.health_check()


# ── LLM ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    prompt: str
    system: str = "You are a helpful assistant."
    model: str = "llama3.2"


@app.post("/api/llm/chat")
async def chat_stream_endpoint(req: ChatRequest):
    messages = [
        {"role": "system", "content": req.system},
        {"role": "user", "content": req.prompt},
    ]

    async def generate():
        # Send request metadata first
        meta = json.dumps({
            "event": "meta",
            "request": {"model": req.model, "messages": messages}
        })
        yield f"data: {meta}\n\n"

        async for token in llm.chat_stream(messages, model=req.model):
            payload = json.dumps({"event": "token", "token": token})
            yield f"data: {payload}\n\n"

        yield "data: " + json.dumps({"event": "done"}) + "\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── Tools ─────────────────────────────────────────────────────────────────────

class ToolsRunRequest(BaseModel):
    prompt: str
    model: str = "llama3.2"


@app.get("/api/tools/schemas")
async def get_tool_schemas():
    return {"tools": TOOL_SCHEMAS}


@app.post("/api/tools/run")
async def run_tools_loop(req: ToolsRunRequest):
    system = build_tool_prompt(TOOL_SCHEMAS)
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": req.prompt},
    ]
    steps = []

    for _ in range(5):
        response = await llm.chat(messages, model=req.model)
        tool_call = parse_tool_call(response)

        if tool_call:
            tool_name = tool_call["tool"]
            params = tool_call.get("params", {})
            observation = run_tool(tool_name, params)

            steps.append({
                "type": "tool_call",
                "llm_response": response,
                "tool": tool_name,
                "params": params,
                "observation": observation,
            })

            messages.append({"role": "assistant", "content": response})
            messages.append({"role": "user", "content": f"Tool result: {observation}\nNow give a final answer."})
        else:
            steps.append({"type": "final_answer", "content": response})
            break

    return {"steps": steps, "messages_sent": messages}


# ── Memory ────────────────────────────────────────────────────────────────────

class MemoryChatRequest(BaseModel):
    session_id: str
    message: str
    model: str = "llama3.2"


class StoreMemoryRequest(BaseModel):
    text: str
    metadata: dict = {}


class RecallRequest(BaseModel):
    query: str


@app.post("/api/memory/chat")
async def memory_chat(req: MemoryChatRequest):
    mem.add_message(req.session_id, "user", req.message)
    history = mem.get_history(req.session_id)

    system = "You are a helpful assistant. Remember everything the user tells you during this conversation."
    messages = [{"role": "system", "content": system}] + history

    response = await llm.chat(messages, model=req.model)
    mem.add_message(req.session_id, "assistant", response)

    return {
        "response": response,
        "history": mem.get_history(req.session_id),
        "messages_in_context": len(messages),
    }


@app.delete("/api/memory/session/{session_id}")
async def clear_memory_session(session_id: str):
    mem.clear_session(session_id)
    return {"cleared": True}


@app.post("/api/memory/store")
async def store_memory(req: StoreMemoryRequest):
    embedding = await llm.embed(req.text)
    idx = mem.store_memory(req.text, embedding, req.metadata)
    return {"id": idx, "text": req.text, "embedding_dims": len(embedding)}


@app.post("/api/memory/recall")
async def recall_memory(req: RecallRequest):
    query_embedding = await llm.embed(req.query)
    results = mem.recall_memory(query_embedding)
    return {"query": req.query, "results": results}


@app.get("/api/memory/list")
async def list_memories():
    return {"memories": mem.list_memories()}


# ── Planning ──────────────────────────────────────────────────────────────────

class PlanRequest(BaseModel):
    goal: str
    model: str = "llama3.2"


@app.post("/api/plan/run")
async def run_plan(req: PlanRequest):
    trace = await run_react_loop(req.goal)
    return {"goal": req.goal, "trace": trace}
