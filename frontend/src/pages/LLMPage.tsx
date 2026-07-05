import { useState, useRef } from 'react'
import PageLayout from '../components/PageLayout'
import Section, { Prose, Callout, DemoBox, Tag } from '../components/Section'
import CodeBlock from '../components/CodeBlock'

const EXAMPLE_REQUEST = JSON.stringify({
  model: 'llama3.2',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain what a token is in 2 sentences.' },
  ],
  stream: true,
}, null, 2)

export default function LLMPage() {
  const [prompt, setPrompt] = useState('')
  const [system, setSystem] = useState('You are a helpful assistant.')
  const [output, setOutput] = useState('')
  const [requestJson, setRequestJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  async function runChat() {
    if (!prompt.trim()) return
    setLoading(true)
    setOutput('')
    setError('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, system }),
        signal: abortRef.current.signal,
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.event === 'meta') {
                setRequestJson(JSON.stringify(data.request, null, 2))
              } else if (data.event === 'token') {
                accumulated += data.token
                setOutput(accumulated)
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError('Could not reach backend. Is the FastAPI server running on :8001?')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout
      badge="Component 1 of 4"
      title="🧠 Large Language Models"
      subtitle="The reasoning engine at the heart of every agent"
    >
      <Section title="What is an LLM?">
        <Prose>
          <p>
            A <strong style={{ color: '#f0f6fc' }}>Large Language Model</strong> is a neural network — typically a Transformer — trained on hundreds of billions of tokens of text. Its only job is to predict: given this sequence of tokens, what is the most likely next token?
          </p>
          <p>
            Despite that simple objective, LLMs develop emergent capabilities: reasoning, code generation, instruction following, and chain-of-thought. These capabilities arise from scale — more parameters, more data, more compute.
          </p>
        </Prose>
      </Section>

      <Section title="Key Concepts">
        <Prose>
          <p><strong style={{ color: '#f0f6fc' }}>Tokens</strong> — LLMs don't process characters or words; they process tokens. A token is a chunk of ~4 characters on average. "unhappiness" might be 3 tokens: "un", "happ", "iness". Everything has a cost in tokens: prompts, responses, tool results, memory context.</p>
          <p><strong style={{ color: '#f0f6fc' }}>Context Window</strong> — The maximum number of tokens the model can "see" at once. Modern models range from 8K to 2M tokens. Everything the agent knows in a given step must fit in this window: system prompt, conversation history, tool results, retrieved memories.</p>
          <p><strong style={{ color: '#f0f6fc' }}>Temperature</strong> — Controls randomness. At temperature 0 the model always picks the highest-probability token (deterministic). At temperature 1 it samples from the distribution. For agents doing precise work (code, math) you want low temperature; for creative tasks, higher.</p>
          <p><strong style={{ color: '#f0f6fc' }}>System Prompt vs User Prompt</strong> — The system prompt sets the model's persona, constraints, and available tools. The user prompt is the actual request. Most agent frameworks put the tool schemas, memory context, and planning instructions in the system prompt.</p>
        </Prose>
      </Section>

      <Section title="Why LLMs Alone Aren't Agents">
        <Callout color="#ffa657">
          A raw LLM is <strong style={{ color: '#ffa657' }}>stateless and sandboxed</strong>. It has no memory between calls, no ability to read files, call APIs, run code, or take actions. It can only transform text → text. The agent loop is the scaffolding that gives it all of those missing capabilities.
        </Callout>
        <div style={{ marginTop: 16 }}>
          <Prose>
            <p>The LLM's role in the agent loop is to act as the <strong style={{ color: '#f0f6fc' }}>reasoning engine</strong>: given all available context (goal, history, tool results, memories), decide what to do next. It either emits a final answer or emits a tool call — the loop handles execution.</p>
          </Prose>
        </div>
      </Section>

      <Section title="Ollama API Shape">
        <Prose>
          <p>All LLM calls in this app go to Ollama at <code style={{ color: '#79c0ff', background: '#161b22', padding: '1px 6px', borderRadius: 4 }}>http://localhost:11434/api/chat</code>. The request looks like this:</p>
        </Prose>
        <CodeBlock code={EXAMPLE_REQUEST} language="json" label="POST /api/chat — Ollama request" />
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Tag color="#58a6ff">llama3.2</Tag>
          <Tag color="#58a6ff">mistral</Tag>
          <Tag color="#58a6ff">qwen2.5</Tag>
          <Tag color="#58a6ff">phi3</Tag>
          <Tag color="#8b949e">any Ollama model</Tag>
        </div>
      </Section>

      <Section title="Live Demo — Talk to the LLM">
        <DemoBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 6 }}>SYSTEM PROMPT</label>
              <textarea
                value={system}
                onChange={e => setSystem(e.target.value)}
                rows={2}
                style={{
                  width: '100%', background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, padding: '10px 12px', color: '#c9d1d9',
                  fontSize: 13, resize: 'vertical', fontFamily: 'monospace',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 6 }}>USER PROMPT</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Explain what a token is in 2 sentences."
                style={{
                  width: '100%', background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, padding: '10px 12px', color: '#c9d1d9',
                  fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </div>
            <button
              onClick={runChat}
              disabled={loading || !prompt.trim()}
              style={{
                alignSelf: 'flex-start', background: loading ? '#30363d' : '#238636',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Generating…' : '▶ Send to LLM'}
            </button>

            {error && <div style={{ color: '#f85149', fontSize: 13 }}>{error}</div>}

            {requestJson && (
              <CodeBlock code={requestJson} language="json" label="Request sent to Ollama /api/chat" />
            )}

            {output && (
              <div>
                <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 6 }}>STREAMED RESPONSE</div>
                <div style={{
                  background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, padding: 16, fontSize: 14,
                  lineHeight: 1.7, color: '#c9d1d9', whiteSpace: 'pre-wrap',
                  minHeight: 60,
                }}>
                  {output}
                  {loading && <span style={{ opacity: 0.5 }}>▋</span>}
                </div>
              </div>
            )}
          </div>
        </DemoBox>
      </Section>
    </PageLayout>
  )
}
