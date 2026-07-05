# Agent Loop Explorer

An interactive study app explaining the four pillars of an AI agent loop:
**LLM · Tools · Memory · Planning** — with live demos powered by local Ollama.

---

## Prerequisites

| Requirement | Version | Install |
|---|---|---|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Ollama | latest | [ollama.com](https://ollama.com) |
| IntelliJ IDEA | any edition | [jetbrains.com](https://www.jetbrains.com/idea/) |

### Pull the Ollama model

```bash
ollama pull llama3.2
```

> The app also uses `nomic-embed-text` for semantic memory. Pull it for the best experience:
> ```bash
> ollama pull nomic-embed-text
> ```
> If not available, the app falls back to a deterministic pseudo-embedding.

---

## Project Structure

```
agent-loop-explorer/
├── backend/          # FastAPI Python server (port 8001)
│   ├── main.py
│   ├── ollama_client.py
│   ├── tools.py
│   ├── memory_store.py
│   ├── planner.py
│   └── requirements.txt
└── frontend/         # React + Vite app (port 5175)
    ├── src/
    │   ├── pages/    # Overview, LLMPage, ToolsPage, MemoryPage, PlanningPage
    │   └── components/
    ├── package.json
    └── vite.config.ts
```

---

## Running in IntelliJ IDEA

### Step 1 — Open the project

1. Open IntelliJ IDEA
2. **File → Open** → select the `agent-loop-explorer` folder
3. IntelliJ will detect both the Python backend and Node.js frontend

---

### Step 2 — Configure the Python backend

#### Set up a Python interpreter

1. Go to **File → Project Structure → SDKs**
2. Click **+** → **Add Python SDK → Virtualenv Environment**
3. Set location to `agent-loop-explorer/backend/.venv`
4. Click **OK**

#### Install backend dependencies

Open the **Terminal** tab in IntelliJ (bottom panel) and run:

```bash
cd backend
pip install fastapi "uvicorn[standard]" httpx numpy pydantic
```

#### Create a Run Configuration for the backend

1. Click **Run → Edit Configurations**
2. Click **+** → **Python**
3. Fill in:
   - **Name:** `Backend`
   - **Script path:** (click folder icon) → select `backend/main.py`
   - **Parameters:** *(leave blank — uvicorn is called via module)*
   - **Working directory:** `<project-root>/backend`
4. Switch the script to use a **module** instead:
   - Change **Script** to **Module name:** `uvicorn`
   - **Parameters:** `main:app --port 8001 --reload`
5. Click **OK**

> **Shortcut:** You can also just run from the IntelliJ Terminal:
> ```bash
> cd backend
> python3 -m uvicorn main:app --port 8001 --reload
> ```

---

### Step 3 — Configure the Node.js frontend

#### Install frontend dependencies

In the IntelliJ Terminal:

```bash
cd frontend
npm install
```

#### Create a Run Configuration for the frontend

1. Click **Run → Edit Configurations**
2. Click **+** → **npm**
3. Fill in:
   - **Name:** `Frontend`
   - **package.json:** `<project-root>/frontend/package.json`
   - **Command:** `run`
   - **Scripts:** `dev`
4. Click **OK**

> **Or run from Terminal:**
> ```bash
> cd frontend
> npm run dev
> ```

---

### Step 4 — Start Ollama

Ollama must be running before starting the backend.

```bash
ollama serve
```

> On macOS, Ollama usually starts automatically as a menu-bar app. Check the top-right menu bar for the Ollama icon.

---

### Step 5 — Run both servers

Using IntelliJ's **Run** toolbar:

1. Select the **Backend** configuration → click ▶ Run
2. Select the **Frontend** configuration → click ▶ Run

Or use the **Compound** run configuration to start both at once:

1. **Run → Edit Configurations → + → Compound**
2. Name it `Agent Loop Explorer`
3. Add both **Backend** and **Frontend** configurations
4. Click **OK** → run the compound configuration

---

### Step 6 — Open the app

Navigate to: **http://localhost:5175**

Verify the backend is healthy: **http://localhost:8001/api/health**

Expected response:
```json
{
  "status": "ok",
  "models": ["llama3.2", "nomic-embed-text:latest", ...]
}
```

---

## Pages & What to Try

| Page | Live Demo to Try |
|---|---|
| **Overview** | Read the architecture diagram and click any component card to jump to its page |
| **🧠 LLM** | Send a prompt — watch it stream token by token and inspect the raw JSON sent to Ollama |
| **🔧 Tools** | Ask "What is 42 * 7?" — watch the LLM emit a tool call, the backend execute it, and the result loop back |
| **💾 Memory** | Tell the bot "My name is Alex", then later ask "What's my name?" — it remembers. Also try storing facts and recalling by semantic similarity |
| **📋 Planning** | Enter "What is sqrt(144)? Is that number prime?" — watch the step-by-step ReAct trace: Thought → Action → Observation → Final Answer |

---

## Ports Reference

| Service | Port | URL |
|---|---|---|
| Ollama | 11434 | http://localhost:11434 |
| FastAPI backend | 8001 | http://localhost:8001 |
| Vite frontend | 5175 | http://localhost:5175 |

---

## Troubleshooting

**Backend can't reach Ollama**
```
{"status": "error", "error": "..."}
```
→ Make sure Ollama is running: `ollama serve`

**Port already in use**
```bash
# Kill whatever is on port 8001
lsof -ti :8001 | xargs kill -9

# Kill whatever is on port 5175
lsof -ti :5175 | xargs kill -9
```

**`python3: command not found`**
→ Install Python 3.10+ or check your IntelliJ interpreter path

**`npm: command not found`**
→ Install Node.js 18+ and restart IntelliJ so it picks up the new PATH

**Model not found error**
→ Run `ollama pull llama3.2` then restart the backend
