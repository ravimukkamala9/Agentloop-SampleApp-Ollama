import math
import json

TOOL_SCHEMAS = [
    {
        "name": "calculator",
        "description": "Evaluate a mathematical expression. Input must be a safe math expression like '42 * 7' or 'sqrt(144)'.",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {"type": "string", "description": "Math expression to evaluate"}
            },
            "required": ["expression"],
        },
    },
    {
        "name": "get_weather",
        "description": "Get the current weather for a city (mock data).",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"}
            },
            "required": ["city"],
        },
    },
    {
        "name": "search",
        "description": "Search for information on a topic (mock results).",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"}
            },
            "required": ["query"],
        },
    },
]

MOCK_WEATHER = {
    "san francisco": {"temp": "62°F", "condition": "Foggy", "humidity": "85%"},
    "new york": {"temp": "75°F", "condition": "Partly Cloudy", "humidity": "60%"},
    "london": {"temp": "55°F", "condition": "Rainy", "humidity": "90%"},
    "tokyo": {"temp": "80°F", "condition": "Sunny", "humidity": "70%"},
}

MOCK_SEARCH = {
    "agent": "An AI agent is a system that perceives its environment, makes decisions, and takes actions to achieve goals. Agents combine LLMs with tools, memory, and planning.",
    "llm": "Large Language Models (LLMs) are neural networks trained on vast text corpora to predict the next token. They power modern AI assistants.",
    "react": "ReAct (Reasoning + Acting) is a prompting technique where the LLM alternates between Thought, Action, and Observation steps to solve problems.",
    "rag": "Retrieval-Augmented Generation (RAG) combines a retrieval system with an LLM, injecting relevant documents into the prompt context.",
}


def run_tool(name: str, params: dict) -> str:
    if name == "calculator":
        try:
            expr = params.get("expression", "")
            safe_globals = {"__builtins__": {}, "sqrt": math.sqrt, "pow": math.pow,
                           "abs": abs, "round": round, "pi": math.pi, "e": math.e,
                           "log": math.log, "sin": math.sin, "cos": math.cos, "tan": math.tan}
            result = eval(expr, safe_globals)  # noqa: S307
            return f"Result: {result}"
        except Exception as ex:
            return f"Error evaluating expression: {ex}"

    elif name == "get_weather":
        city = params.get("city", "").lower().strip()
        data = MOCK_WEATHER.get(city)
        if data:
            return f"Weather in {params['city']}: {data['temp']}, {data['condition']}, Humidity: {data['humidity']}"
        return f"Weather data not available for {params['city']} (mock data only has: San Francisco, New York, London, Tokyo)"

    elif name == "search":
        query = params.get("query", "").lower()
        for key, result in MOCK_SEARCH.items():
            if key in query:
                return result
        return f"Search results for '{params['query']}': No specific results found in mock database. In a real agent, this would hit a search API."

    return f"Unknown tool: {name}"


TOOL_SYSTEM_PROMPT = """You are a helpful AI assistant with access to the following tools:

{tools}

To use a tool, respond with ONLY a JSON object in this exact format:
{{"tool": "<tool_name>", "params": {{"<param>": "<value>"}}}}

If you don't need a tool and can answer directly, just respond normally in plain text.
Do not mix tool calls with regular text in the same response.
Think carefully about whether you need a tool or can answer from your own knowledge."""


def build_tool_prompt(tools: list[dict]) -> str:
    tool_descriptions = "\n".join(
        f"- {t['name']}: {t['description']}" for t in tools
    )
    return TOOL_SYSTEM_PROMPT.format(tools=tool_descriptions)


def parse_tool_call(response: str) -> dict | None:
    """Try to extract a tool call JSON from LLM response."""
    text = response.strip()
    # Find JSON object in response
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        return None
    try:
        obj = json.loads(text[start:end])
        if "tool" in obj and "params" in obj:
            return obj
    except json.JSONDecodeError:
        pass
    return None
