import { useState, useRef } from 'react'
import PageLayout from '../components/PageLayout'
import Section, { Prose, Callout, DemoBox } from '../components/Section'

interface ChatMsg { role: 'user' | 'assistant'; content: string }
interface MemoryItem { id: number; text: string }
interface RecallResult { score: number; text: string }

function generateSessionId() {
  return 'session-' + Math.random().toString(36).slice(2, 9)
}

export default function MemoryPage() {
  // Short-term (conversation) memory
  const [sessionId] = useState(generateSessionId)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  // Long-term (semantic) memory
  const [memInput, setMemInput] = useState('')
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [recallQuery, setRecallQuery] = useState('')
  const [recallResults, setRecallResults] = useState<RecallResult[]>([])
  const [memLoading, setMemLoading] = useState(false)

  const [error, setError] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  async function sendChat() {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatHistory(h => [...h, { role: 'user', content: msg }])
    setChatLoading(true)
    setError('')

    try {
      const res = await fetch('/api/memory/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: msg }),
      })
      const data = await res.json()
      setChatHistory(h => [...h, { role: 'assistant', content: data.response }])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {
      setError('Could not reach backend.')
    } finally {
      setChatLoading(false)
    }
  }

  async function clearSession() {
    await fetch(`/api/memory/session/${sessionId}`, { method: 'DELETE' })
    setChatHistory([])
  }

  async function storeMem() {
    if (!memInput.trim()) return
    setMemLoading(true)
    try {
      const res = await fetch('/api/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: memInput }),
      })
      const data = await res.json()
      setMemories(m => [...m, { id: data.id, text: data.text }])
      setMemInput('')
    } catch {
      setError('Could not reach backend.')
    } finally {
      setMemLoading(false)
    }
  }

  async function recallMem() {
    if (!recallQuery.trim()) return
    setMemLoading(true)
    try {
      const res = await fetch('/api/memory/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: recallQuery }),
      })
      const data = await res.json()
      setRecallResults(data.results || [])
    } catch {
      setError('Could not reach backend.')
    } finally {
      setMemLoading(false)
    }
  }

  return (
    <PageLayout
      badge="Component 3 of 4"
      title="💾 Memory"
      subtitle="How agents maintain state across turns and retrieve knowledge"
    >
      <Section title="Why Memory Matters">
        <Prose>
          <p>
            Every LLM call is <strong style={{ color: '#f0f6fc' }}>stateless</strong>. Without memory, each request starts from scratch — the model doesn't know what you said in the last turn, what tools it already used, or what it learned in previous sessions. Memory is the scaffolding that converts a stateless model into a stateful agent.
          </p>
        </Prose>
      </Section>

      <Section title="Types of Memory">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
          {[
            {
              type: 'Short-term (Conversation Buffer)',
              color: '#58a6ff',
              icon: '📝',
              description: 'The full conversation history — all prior messages — concatenated into the current context window. This is the simplest form: just keep appending. Works until you hit the context limit.',
              tradeoff: 'Limit: context window fills up. Solution: summarise old messages or truncate.',
            },
            {
              type: 'Long-term (Vector Store / Retrieval)',
              color: '#d2a8ff',
              icon: '🗃',
              description: 'Facts, documents, or past experiences stored as embeddings in a vector database. At query time, embed the current question and retrieve the most semantically similar stored memories. This is what powers RAG (Retrieval-Augmented Generation).',
              tradeoff: 'Requires an embedding model. Retrieval quality depends on embedding quality and chunking strategy.',
            },
            {
              type: 'Working Memory (Scratchpad)',
              color: '#3fb950',
              icon: '📋',
              description: 'A temporary scratchpad within a single reasoning loop. The LLM\'s "Thought:" step in ReAct is working memory — intermediate reasoning that informs the next action but may not be kept long-term.',
              tradeoff: 'Only persists within one loop execution; not stored between agent invocations.',
            },
            {
              type: 'Episodic vs Semantic',
              color: '#ffa657',
              icon: '🧩',
              description: 'Episodic memory is "what happened" — event logs, conversation transcripts. Semantic memory is "what is true" — facts, knowledge. Human brains separate these; agent systems often conflate them. Explicit separation improves retrieval precision.',
              tradeoff: 'More complex to implement and route queries to the right memory type.',
            },
          ].map(m => (
            <div key={m.type} style={{
              background: '#161b22', border: `1px solid ${m.color}33`,
              borderRadius: 10, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.type}</span>
              </div>
              <p style={{ fontSize: 14, color: '#c9d1d9', lineHeight: 1.6 }}>{m.description}</p>
              <p style={{ fontSize: 12, color: '#8b949e', marginTop: 8, lineHeight: 1.5 }}>
                <strong style={{ color: '#8b949e' }}>Trade-off:</strong> {m.tradeoff}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Context Window as Working Memory">
        <Callout color="#58a6ff">
          <strong style={{ color: '#58a6ff' }}>Key mental model:</strong> The context window IS the agent's working memory for a given step. Everything the model can "think about" right now must fit in this window. Memory systems are essentially compression and retrieval mechanisms to decide <em>what</em> gets put in the window for each new request.
        </Callout>
      </Section>

      <Section title="Demo 1 — Short-term Memory (Conversation Buffer)" accent="#58a6ff">
        <Prose>
          <p>Each message is stored server-side keyed to your session ID and replayed in full on every subsequent call. Notice that the model remembers what you said earlier in the conversation.</p>
          <p style={{ fontSize: 12, color: '#8b949e' }}>Session: <code style={{ color: '#79c0ff' }}>{sessionId}</code></p>
        </Prose>
        <DemoBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ height: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
              {chatHistory.length === 0 && (
                <div style={{ color: '#8b949e', fontSize: 13, textAlign: 'center', marginTop: 80 }}>
                  Start a conversation — try "My name is Alex" then later ask "What's my name?"
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? '#1f6feb' : '#21262d',
                  borderRadius: 10, padding: '8px 14px',
                  maxWidth: '80%', fontSize: 13, lineHeight: 1.5, color: '#f0f6fc',
                  whiteSpace: 'pre-wrap',
                }}>
                  <div style={{ fontSize: 10, color: m.role === 'user' ? '#cfe2ff' : '#8b949e', marginBottom: 4 }}>
                    {m.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  {m.content}
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', background: '#21262d', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#8b949e' }}>
                  ⏳ thinking…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Type a message…"
                style={{
                  flex: 1, background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, padding: '10px 12px', color: '#c9d1d9',
                  fontSize: 13,
                }}
              />
              <button onClick={sendChat} disabled={chatLoading} style={{
                background: '#1f6feb', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Send</button>
              <button onClick={clearSession} style={{
                background: '#30363d', color: '#8b949e', border: 'none',
                borderRadius: 8, padding: '10px 12px', fontSize: 12, cursor: 'pointer',
              }}>Clear</button>
            </div>
          </div>
        </DemoBox>
      </Section>

      <Section title="Demo 2 — Long-term Semantic Memory" accent="#d2a8ff">
        <Prose>
          <p>Store facts as embeddings (via Ollama's embedding model). Then recall by semantic similarity — the most relevant stored facts float to the top even if your query uses different words.</p>
        </Prose>
        <DemoBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 6 }}>STORE A FACT</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={memInput}
                  onChange={e => setMemInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && storeMem()}
                  placeholder='e.g. "The Eiffel Tower is in Paris, France"'
                  style={{
                    flex: 1, background: '#0d1117', border: '1px solid #30363d',
                    borderRadius: 8, padding: '10px 12px', color: '#c9d1d9', fontSize: 13,
                  }}
                />
                <button onClick={storeMem} disabled={memLoading} style={{
                  background: '#6e40c9', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Store</button>
              </div>
              {memories.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {memories.map(m => (
                    <div key={m.id} style={{
                      background: '#1a0f2e', borderRadius: 6, padding: '6px 12px',
                      fontSize: 12, color: '#d2a8ff', display: 'flex', gap: 8,
                    }}>
                      <span style={{ color: '#6e40c9' }}>#{m.id}</span> {m.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 6 }}>RECALL BY SIMILARITY</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={recallQuery}
                  onChange={e => setRecallQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && recallMem()}
                  placeholder='e.g. "What famous landmark is in France?"'
                  style={{
                    flex: 1, background: '#0d1117', border: '1px solid #30363d',
                    borderRadius: 8, padding: '10px 12px', color: '#c9d1d9', fontSize: 13,
                  }}
                />
                <button onClick={recallMem} disabled={memLoading || memories.length === 0} style={{
                  background: '#6e40c9', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Recall</button>
              </div>
              {recallResults.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recallResults.map((r, i) => (
                    <div key={i} style={{
                      background: '#161b22', border: '1px solid #d2a8ff33',
                      borderRadius: 8, padding: '10px 14px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#8b949e' }}>Rank #{i + 1}</span>
                        <span style={{ fontSize: 11, color: '#d2a8ff' }}>
                          similarity: {r.score.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#c9d1d9' }}>{r.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DemoBox>
      </Section>

      {error && <div style={{ color: '#f85149', fontSize: 13, marginTop: 8 }}>{error}</div>}
    </PageLayout>
  )
}
