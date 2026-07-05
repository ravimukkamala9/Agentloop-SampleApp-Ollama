from tools import TOOL_SCHEMAS, build_tool_prompt, parse_tool_call, run_tool
import ollama_client as llm

MAX_STEPS = 6

REACT_SYSTEM = """You are an AI agent that solves problems step by step using the ReAct pattern.

Available tools:
{tools}

At each step you MUST output EXACTLY ONE of the following formats:

Format A — when you need to use a tool:
Thought: <your reasoning about what to do next>
Action: {{"tool": "<tool_name>", "params": {{"<key>": "<value>"}}}}

Format B — when you have the final answer:
Thought: <your final reasoning>
Final Answer: <your complete answer to the user>

Rules:
- Always start with "Thought:"
- After a tool result is shown as "Observation:", continue with another Thought
- Use "Final Answer:" only when you're done
- Be concise in your thoughts"""


async def run_react_loop(goal: str) -> list[dict]:
    """Run a ReAct planning loop and return the trace of steps."""
    tool_list = "\n".join(f"- {t['name']}: {t['description']}" for t in TOOL_SCHEMAS)
    system = REACT_SYSTEM.format(tools=tool_list)

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Goal: {goal}"},
    ]

    trace = []

    for step_num in range(MAX_STEPS):
        response = await llm.chat(messages)

        # Parse the response
        thought = ""
        action = None
        final_answer = None

        lines = response.strip().split("\n")
        current_section = None
        action_text = ""

        for line in lines:
            if line.startswith("Thought:"):
                thought = line[len("Thought:"):].strip()
                current_section = "thought"
            elif line.startswith("Action:"):
                action_text = line[len("Action:"):].strip()
                current_section = "action"
            elif line.startswith("Final Answer:"):
                final_answer = line[len("Final Answer:"):].strip()
                current_section = "final"
            elif current_section == "action":
                action_text += " " + line.strip()
            elif current_section == "final":
                final_answer = (final_answer or "") + " " + line.strip()

        if not thought:
            thought = response[:200]

        step = {"step": step_num + 1, "thought": thought}

        if final_answer:
            step["type"] = "final"
            step["answer"] = final_answer.strip()
            trace.append(step)
            break

        if action_text:
            tool_call = parse_tool_call(action_text)
            if tool_call:
                tool_name = tool_call["tool"]
                params = tool_call.get("params", {})
                observation = run_tool(tool_name, params)

                step["type"] = "action"
                step["tool"] = tool_name
                step["params"] = params
                step["observation"] = observation
                trace.append(step)

                messages.append({"role": "assistant", "content": response})
                messages.append({
                    "role": "user",
                    "content": f"Observation: {observation}\n\nContinue."
                })
            else:
                step["type"] = "error"
                step["error"] = f"Could not parse action: {action_text}"
                trace.append(step)
                break
        else:
            # LLM gave a plain response without action or final answer
            step["type"] = "final"
            step["answer"] = response.strip()
            trace.append(step)
            break

    return trace
