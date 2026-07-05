import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import Section, { Prose, Callout, DemoBox } from '../components/Section'
import CodeBlock from '../components/CodeBlock'

const TOOL_SCHEMA_EXAMPLE = JSON.stringify({
  name: 'calculator',
  description: 'Evaluate a mathematical expression.',
  parameters: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'Math expression to evaluate' },
    },
    required: ['expression'],
  },
}, null, 2)

const ANTHROPIC_TOOL_EXAMPLE = JSON.stringify({
  type: 'tool_use',
  id: 'toolu_01XFBv',
  name: 'calculator',
  input: { expression: '42 * 7' },
}, null, 2)

interface Step {
  type: 'tool_call' | 'final_answer'
  llm_response?: string
  tool?: string
  params?: Record<string, string>
  observation?: string
  content?: string
}

const SUGGESTIONS = [
  'What is 42 * 7?',
  'What is the weather in Tokyo?',
  'What is sqrt(256)?',
  'Search for information about agents',
]

export default function ToolsPage() {
  const [prompt, setPrompt] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runTools() {
    if (!prompt.trim()) return
    setLoading(true)
    setSteps([])
    setError('')

    try {
      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      setSteps(data.steps || [])
    } catch {
      setError('Could not reach backend. Is the FastAPI server running on :8001?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout
      badge="Component 2 of 4"
      title="🔧 Tools (Function Calling)"
      subtitle="How agents reach outside the LLM to act on the world"
    >
      <Section title="What Are Tools?">
        <Prose>
          <p>
            An LLM's knowledge is frozen at its training cutoff and it cannot take actions. <strong style={{ color: '#f0f6fc' }}>Tools</strong> (also called "function calling") break both constraints: the agent can call a calculator, search the web, read a database, send an email — anything you implement as a function.
          </p>
          <p>
            The key insight is that the LLM itself doesn't execute the tool. It emits a structured tool-call (JSON), and the <strong style={{ color: '#f0f6fc' }}>agent loop</strong> intercepts it, executes the real function, and injects the result back into the conversation. The LLM then sees the result and continues reasoning.
          </p>
        </Prose>
      </Section>

      <Section title="Tool Schema — JSON Schema Format">
        <Prose>
          <p>Tools are described to the LLM using <strong style={{ color: '#f0f6fc' }}>JSON Schema</strong>. The schema tells the model: what is the tool's name, what does it do, and what parameters does it expect?</p>
        </Prose>
        <CodeBlock code={TOOL_SCHEMA_EXAMPLE} language="json" label="Tool schema passed in system prompt" />
      </Section>

      <Section title="How the LLM Signals a Tool Call">
        <Prose>
          <p>When the LLM decides to use a tool, it emits a structured response. Anthropic's format uses a <code style={{ color: '#79c0ff', background: '#161b22', padding: '1px 6px', borderRadius: 4 }}>tool_use</code> content block:</p>
        </Prose>
        <CodeBlock code={ANTHROPIC_TOOL_EXAMPLE} language="json" label="LLM response — tool_use block (Anthropic format)" />
        <Prose>
          <p style={{ marginTop: 12 }}>In this demo we use a text-based format (the LLM emits JSON in its text) because Ollama doesn't natively support structured tool-use. In production with Claude or GPT-4, the tool call arrives as a structured message type, not embedded text.</p>
        </Prose>
      </Section>

      <Section title="The Tool Execution Loop">
        <Callout color="#3fb950">
          <strong style={{ color: '#3fb950' }}>The pattern:</strong>
          <ol style={{ marginLeft: 20, marginTop: 8, lineHeight: 2 }}>
            <li>LLM receives user query + tool schemas in system prompt</li>
            <li>LLM emits a tool call (JSON) instead of a final answer</li>
            <li>Agent loop detects the tool call, executes the function</li>
            <li>Tool result is injected back into the conversation as a new message</li>
            <li>LLM is called again — now it sees the result and can answer (or call another tool)</li>
          </ol>
        </Callout>
      </Section>

      <Section title="Available Tools in This Demo">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { name: 'calculator(expr)', color: '#58a6ff', example: '"42 * 7"', desc: 'Evaluates safe math expressions using Python eval with restricted globals' },
            { name: 'get_weather(city)', color: '#3fb950', example: '"Tokyo"', desc: 'Returns mock weather data for SF, NYC, London, Tokyo' },
            { name: 'search(query)', color: '#d2a8ff', example: '"ReAct"', desc: 'Returns mock search results from a keyword-matched mini-corpus' },
          ].map(t => (
            <div key={t.name} style={{ background: '#0d1117', border: `1px solid ${t.color}33`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: t.color, marginBottom: 6 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>{t.desc}</div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#8b949e' }}>example: <span style={{ color: '#c9d1d9' }}>{t.example}</span></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Live Demo — Tool Use Loop" accent="#3fb950">
        <DemoBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 8 }}>TRY ONE OF THESE</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setPrompt(s)} style={{
                    background: '#21262d', border: '1px solid #30363d', borderRadius: 20,
                    padding: '5px 12px', fontSize: 12, color: '#c9d1d9', cursor: 'pointer',
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={2}
              placeholder="Ask something that requires a tool…"
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, padding: '10px 12px', color: '#c9d1d9',
                fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <button onClick={runTools} disabled={loading || !prompt.trim()} style={{
              alignSelf: 'flex-start', background: loading ? '#30363d' : '#1a7f37',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? '⏳ Running loop…' : '▶ Run Tool Loop'}
            </button>

            {error && <div style={{ color: '#f85149', fontSize: 13 }}>{error}</div>}

            {steps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {steps.map((step, i) => (
                  <div key={i}>
                    {step.type === 'tool_call' ? (
                      <div style={{ border: '1px solid #3fb95044', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ background: '#0f2a1544', padding: '8px 14px', fontSize: 12, color: '#3fb950', fontWeight: 600 }}>
                          Step {i + 1} — Tool Call
                        </div>
                        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>LLM DECIDED TO CALL</div>
                            <code style={{ fontSize: 13, color: '#3fb950' }}>
                              {step.tool}({JSON.stringify(step.params)})
                            </code>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>TOOL RESULT (injected back as context)</div>
                            <div style={{ background: '#0d1117', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#c9d1d9', fontFamily: 'monospace' }}>
                              {step.observation}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ border: '1px solid #58a6ff44', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ background: '#0d213744', padding: '8px 14px', fontSize: 12, color: '#58a6ff', fontWeight: 600 }}>
                          Step {i + 1} — Final Answer
                        </div>
                        <div style={{ padding: 14, fontSize: 14, lineHeight: 1.7, color: '#c9d1d9', whiteSpace: 'pre-wrap' }}>
                          {step.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DemoBox>
      </Section>
    </PageLayout>
  )
}
