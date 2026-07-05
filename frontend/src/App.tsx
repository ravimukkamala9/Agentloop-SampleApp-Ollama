import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Overview from './pages/Overview'
import LLMPage from './pages/LLMPage'
import ToolsPage from './pages/ToolsPage'
import MemoryPage from './pages/MemoryPage'
import PlanningPage from './pages/PlanningPage'

const NAV = [
  { to: '/', label: '🗺 Overview', end: true },
  { to: '/llm', label: '🧠 LLM' },
  { to: '/tools', label: '🔧 Tools' },
  { to: '/memory', label: '💾 Memory' },
  { to: '/planning', label: '📋 Planning' },
]

const styles: Record<string, React.CSSProperties> = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220,
    background: '#161b22',
    borderRight: '1px solid #30363d',
    padding: '24px 0',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    flexShrink: 0,
  },
  logo: {
    padding: '0 20px 24px',
    borderBottom: '1px solid #30363d',
    marginBottom: 16,
  },
  logoTitle: { fontSize: 16, fontWeight: 700, color: '#58a6ff', lineHeight: 1.3 },
  logoSub: { fontSize: 11, color: '#8b949e', marginTop: 4 },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' },
  main: { flex: 1, overflowY: 'auto', background: '#0d1117' },
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={styles.layout}>
        <nav style={styles.sidebar}>
          <div style={styles.logo}>
            <div style={styles.logoTitle}>Agent Loop Explorer</div>
            <div style={styles.logoSub}>LLM · Tools · Memory · Planning</div>
          </div>
          <div style={styles.nav}>
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '10px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#f0f6fc' : '#8b949e',
                  background: isActive ? '#1f6feb22' : 'transparent',
                  borderLeft: isActive ? '3px solid #58a6ff' : '3px solid transparent',
                  transition: 'all 0.15s',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/llm" element={<LLMPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/planning" element={<PlanningPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
