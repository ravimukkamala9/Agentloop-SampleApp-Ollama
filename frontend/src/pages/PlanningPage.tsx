import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import Section, { Prose, Callout, DemoBox } from '../components/Section'
import CodeBlock from '../components/CodeBlock'

const REACT_EXAMPLE = `Thought: I need to find the square root of 144 first, then check if that result is prime.
Action: {"tool": "calculator", "params": {"expression": "sqrt(144)"}}

Observation: Result: 12.0

Thought: The square root of 144 is 12. Now I need to check if 12 is prime.
         12 = 2 × 6 = 2 × 2 × 3, so it is NOT prime.
Final Answer: The square root of 144 is 12. The number 12 is not prime —
             it factors as 2 × 2 × 3.`

const SUGGESTIONS = [
  'What is the square root of 144? Is that number prime?',
  'What is 15 * 23? Then add 100 to that result.',
  'What is the weather in London and Tokyo?',
  'Calculate 2 to the power of 10, then divide by 4.',
]

interface TraceStep {
  step: number
  thought: string
  type: 'action' | 'final' | 'error'
  tool?: string
  params?: Record<string, string>
  observation?: string
  answer?: string
  error?: string
}

const STEP_COLORS: Record<string, string> = {
  action: '#ffa657',
  final: '#3fb950',
  error: '#f85149',
}

export default function PlanningPage() {
  const [goal, setGoal] = useState('')
  const [trace, setTrace] = useState<TraceStep[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runPlan() {
    if (!goal.trim()) return
    setLoading(true)
    setTrace([])
    setError('')

    try {
      const res = await fetch('/api/plan/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
      const data = await res.json()
      setTrace(data.trace || [])
    } catch {
      setError('Could not reach backend. Is the FastAPI server running on :8001?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout
      badge="Component 4 of 4"
      title="📋 Planning"
      subtitle="ReAct, Chain-of-Thought, and multi-step goal decomposition"
    >
      <Section title="Why Agents Need Planning">
        <Prose>
          <p>
            A single LLM call handles simple, one-shot requests well. But complex goals — "research competitor pricing, compare to ours, write a report, and send it to the team" — require multiple steps, intermediate results, and conditional branching. <strong style={{ color: '#f0f6fc' }}>Planning</strong> is the mechanism that decomposes a goal into steps and executes them in order.
          </p>
        </Prose>
      </Section>

      <Section title="The ReAct Pattern">
        <Prose>
          <p>
            <strong style={{ color: '#f0f6fc' }}>ReAct (Reasoning + Acting)</strong>, introduced by Yao et al. 2022, is the most widely used agent planning pattern. The model interleaves reasoning steps ("Thought") with action steps ("Action") and observes the results before continuing.
          </p>
          <p>The loop is:</p>
        </Prose>
        <div style={{ display: 'flex', gap: 0, marginTop: 16, alignItems: 'stretch' }}>
          {[
            { label: 'Thought', color: '#d2a8ff', desc: 'LLM reasons about the current state and what to do next' },
            { label: 'Action', color: '#ffa657', desc: 'LLM emits a tool call (or decides to answer)' },
            { label: 'Observation', color: '#3fb950', desc: 'Tool result is injected back into context' },
          ].map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                background: s.color + '22', border: `1px solid ${s.color}55`,
                borderRadius: 10, padding: '14px 18px', textAlign: 'center', minWidth: 150,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
              {i < 2 && <div style={{ fontSize: 20, color: '#8b949e', margin: '0 8px' }}>→</div>}
            </div>
          ))}
          <div style={{ fontSize: 20, color: '#8b949e', margin: '0 8px', display: 'flex', alignItems: 'center' }}>↺</div>
        </div>
        <CodeBlock code={REACT_EXAMPLE} language="text" label="Example ReAct trace — square root + primality check" />
      </Section>

      <Section title="Planning Strategies Compared">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            {
              name: 'ReAct',
              color: '#ffa657',
              when: 'Most situations — the default choice',
              how: 'Interleave Thought + Action + Observation in a single context. Simple, effective, widely supported.',
              limit: 'Can get lost on very long chains; each step extends context.',
            },
            {
              name: 'Chain-of-Thought (CoT)',
              color: '#58a6ff',
              when: 'Single-call reasoning — no tools needed',
              how: 'Prompt the LLM to "think step by step" before answering. No loop, no tools — just structured internal reasoning.',
              limit: 'No external actions; knowledge is limited to training data.',
            },
            {
              name: 'Plan-and-Execute',
              color: '#d2a8ff',
              when: 'Long-horizon, parallelizable tasks',
              how: 'First call produces a full plan (list of steps). Second phase executes each step, possibly in parallel.',
              limit: 'Plan may become stale if early steps fail or return unexpected results.',
            },
            {
              name: 'Tree of Thoughts (ToT)',
              color: '#3fb950',
              when: 'Creative or exploratory tasks with many valid paths',
              how: 'Explore multiple reasoning branches simultaneously, evaluate them, backtrack on dead ends.',
              limit: 'Expensive: requires many LLM calls. Usually overkill for tool-use agents.',
            },
          ].map(s => (
            <div key={s.name} style={{
              background: '#161b22', border: `1px solid ${s.color}33`,
              borderRadius: 10, padding: 16, display: 'grid',
              gridTemplateColumns: '140px 1fr 1fr 1fr', gap: 12, alignItems: 'start',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.name}</div>
              <div>
                <div style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>WHEN</div>
                <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.5 }}>{s.when}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>HOW</div>
                <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.5 }}>{s.how}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#f85149', marginBottom: 4 }}>LIMIT</div>
                <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>{s.limit}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Planning + Memory">
        <Callout color="#ffa657">
          <strong style={{ color: '#ffa657' }}>Planning and memory are complementary.</strong> The planner decides <em>what to do</em>; memory decides <em>what to remember</em>. A full agent uses both: the planner keeps a scratchpad of intermediate results (working memory), and long-term memory provides background knowledge the planner can query at any step.
        </Callout>
      </Section>

      <Section title="Live Demo — ReAct Planning Loop" accent="#ffa657">
        <DemoBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 8 }}>TRY ONE OF THESE MULTI-STEP GOALS</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setGoal(s)} style={{
                    background: '#21262d', border: '1px solid #30363d', borderRadius: 20,
                    padding: '5px 12px', fontSize: 12, color: '#c9d1d9', cursor: 'pointer',
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              rows={2}
              placeholder="Enter a multi-step goal…"
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, padding: '10px 12px', color: '#c9d1d9',
                fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <button onClick={runPlan} disabled={loading || !goal.trim()} style={{
              alignSelf: 'flex-start', background: loading ? '#30363d' : '#9a5508',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? '⏳ Planning…' : '▶ Run ReAct Loop'}
            </button>

            {error && <div style={{ color: '#f85149', fontSize: 13 }}>{error}</div>}

            {trace.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 4 }}>REASONING TRACE</div>
                {trace.map((step) => {
                  const color = STEP_COLORS[step.type] || '#8b949e'
                  return (
                    <div key={step.step} style={{
                      border: `1px solid ${color}44`,
                      borderRadius: 8, overflow: 'hidden',
                    }}>
                      <div style={{
                        background: color + '22', padding: '8px 14px',
                        fontSize: 12, color, fontWeight: 600,
                        display: 'flex', gap: 12,
                      }}>
                        <span>Step {step.step}</span>
                        <span style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{step.type}</span>
                      </div>
                      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {step.thought && (
                          <div>
                            <div style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>THOUGHT</div>
                            <div style={{ fontSize: 13, color: '#d2a8ff', fontStyle: 'italic', lineHeight: 1.6 }}>
                              {step.thought}
                            </div>
                          </div>
                        )}
                        {step.tool && (
                          <div>
                            <div style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>ACTION</div>
                            <code style={{ fontSize: 13, color: '#ffa657' }}>
                              {step.tool}({JSON.stringify(step.params)})
                            </code>
                          </div>
                        )}
                        {step.observation && (
                          <div>
                            <div style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>OBSERVATION</div>
                            <div style={{ background: '#0d1117', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#3fb950', fontFamily: 'monospace' }}>
                              {step.observation}
                            </div>
                          </div>
                        )}
                        {step.answer && (
                          <div>
                            <div style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>FINAL ANSWER</div>
                            <div style={{ fontSize: 14, color: '#c9d1d9', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                              {step.answer}
                            </div>
                          </div>
                        )}
                        {step.error && (
                          <div style={{ fontSize: 13, color: '#f85149' }}>{step.error}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DemoBox>
      </Section>
    </PageLayout>
  )
}
