import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Section, { Prose, Callout } from '../components/Section'

const CARDS = [
  { to: '/llm', emoji: '🧠', label: 'LLM', color: '#58a6ff', desc: 'The reasoning engine — processes context and generates next tokens' },
  { to: '/tools', emoji: '🔧', label: 'Tools', color: '#3fb950', desc: 'Functions the agent can call to act on the world' },
  { to: '/memory', emoji: '💾', label: 'Memory', color: '#d2a8ff', desc: 'Short-term and long-term stores that give the agent state' },
  { to: '/planning', emoji: '📋', label: 'Planning', color: '#ffa657', desc: 'ReAct-style reasoning loops that decompose complex goals' },
]

export default function Overview() {
  const navigate = useNavigate()
  return (
    <PageLayout
      badge="Start Here"
      title="The Agent Loop"
      subtitle="How LLMs become autonomous agents — and what each component does"
    >
      <Section title="What is an Agent?">
        <Prose>
          <p>
            A <strong style={{ color: '#f0f6fc' }}>language model alone</strong> is stateless and passive: you send it text, it predicts the next token, done. There's no ability to remember past conversations, take actions in the world, or break a complex goal into steps.
          </p>
          <p>
            An <strong style={{ color: '#f0f6fc' }}>agent</strong> wraps an LLM in a loop. On each turn, the model can (a) emit a final answer, or (b) call a tool and loop again with the result injected back into context. Add a memory store to persist state across turns, and a planner to decompose multi-step goals — and you have a full autonomous agent.
          </p>
          <p>
            Real-world examples: a customer support bot that looks up orders in a database before answering; a coding assistant that reads files, runs tests, and iterates until they pass; an autonomous research agent that searches the web, takes notes, and synthesises a report.
          </p>
        </Prose>
      </Section>

      <Section title="The Loop Diagram">
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <svg viewBox="0 0 760 200" style={{ width: '100%', maxWidth: 760, height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#8b949e" />
              </marker>
            </defs>

            {/* User */}
            <rect x="10" y="70" width="110" height="60" rx="10" fill="#1f2937" stroke="#374151" strokeWidth="1.5" />
            <text x="65" y="97" textAnchor="middle" fill="#f0f6fc" fontSize="13" fontWeight="700">👤 User</text>
            <text x="65" y="115" textAnchor="middle" fill="#8b949e" fontSize="10">Input / Goal</text>

            {/* Arrow user -> llm */}
            <line x1="120" y1="100" x2="178" y2="100" stroke="#8b949e" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* LLM */}
            <rect x="180" y="55" width="140" height="90" rx="10" fill="#0d2137" stroke="#58a6ff" strokeWidth="2" />
            <text x="250" y="90" textAnchor="middle" fill="#58a6ff" fontSize="13" fontWeight="700">🧠 LLM</text>
            <text x="250" y="108" textAnchor="middle" fill="#8b949e" fontSize="10">Reason &amp; Decide</text>
            <text x="250" y="124" textAnchor="middle" fill="#8b949e" fontSize="10">Answer or Act?</text>

            {/* Arrow llm -> tools */}
            <line x1="320" y1="82" x2="378" y2="65" stroke="#8b949e" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* Tools */}
            <rect x="380" y="20" width="120" height="55" rx="10" fill="#0f2a15" stroke="#3fb950" strokeWidth="1.5" />
            <text x="440" y="47" textAnchor="middle" fill="#3fb950" fontSize="13" fontWeight="700">🔧 Tools</text>
            <text x="440" y="63" textAnchor="middle" fill="#8b949e" fontSize="10">Execute &amp; Return</text>

            {/* Arrow llm -> memory */}
            <line x1="320" y1="100" x2="378" y2="100" stroke="#8b949e" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* Memory */}
            <rect x="380" y="78" width="120" height="55" rx="10" fill="#1a0f2e" stroke="#d2a8ff" strokeWidth="1.5" />
            <text x="440" y="105" textAnchor="middle" fill="#d2a8ff" fontSize="13" fontWeight="700">💾 Memory</text>
            <text x="440" y="121" textAnchor="middle" fill="#8b949e" fontSize="10">Retrieve Context</text>

            {/* Arrow llm -> planning */}
            <line x1="320" y1="118" x2="378" y2="138" stroke="#8b949e" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* Planning */}
            <rect x="380" y="125" width="120" height="55" rx="10" fill="#2a1a0f" stroke="#ffa657" strokeWidth="1.5" />
            <text x="440" y="152" textAnchor="middle" fill="#ffa657" fontSize="13" fontWeight="700">📋 Planning</text>
            <text x="440" y="168" textAnchor="middle" fill="#8b949e" fontSize="10">Decompose Goal</text>

            {/* Arrows back to LLM */}
            <path d="M500,47 Q560,47 560,100 Q560,100 322,100" stroke="#8b949e" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" strokeDasharray="4,3" />

            {/* Arrow llm -> user (final answer) */}
            <path d="M250,145 Q250,175 65,175 Q65,145 65,130" stroke="#8b949e" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" strokeDasharray="4,3" />

            {/* Label "loop back" */}
            <text x="540" y="40" textAnchor="middle" fill="#8b949e" fontSize="9">results loop back</text>
            <text x="160" y="170" textAnchor="middle" fill="#8b949e" fontSize="9">final answer</text>
          </svg>
        </div>
      </Section>

      <Section title="The Four Components">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {CARDS.map(({ to, emoji, label, color, desc }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              style={{
                background: '#161b22', border: `1px solid ${color}44`,
                borderRadius: 10, padding: 20, textAlign: 'left',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = color + '44')}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.5 }}>{desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Key Insight">
        <Callout color="#ffa657">
          <strong style={{ color: '#ffa657' }}>The loop is what makes it an agent.</strong> A single LLM call is a function. An LLM that can call tools, observe results, and call more tools until it reaches a goal — that's an agent. Each iteration through the loop is one "step" of reasoning.
        </Callout>
      </Section>
    </PageLayout>
  )
}
