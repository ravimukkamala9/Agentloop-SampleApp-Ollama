import React from 'react'

interface Props {
  title: string
  children: React.ReactNode
  accent?: string
}

export default function Section({ title, children, accent = '#58a6ff' }: Props) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{
        fontSize: 18, fontWeight: 700, color: accent,
        marginBottom: 16, paddingBottom: 8,
        borderBottom: `1px solid #21262d`,
      }}>{title}</h2>
      {children}
    </div>
  )
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 15, lineHeight: 1.8, color: '#c9d1d9',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {children}
    </div>
  )
}

export function Callout({ children, color = '#58a6ff' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      background: '#161b22', border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`, borderRadius: 8,
      padding: '14px 18px', fontSize: 14, lineHeight: 1.7, color: '#c9d1d9',
    }}>
      {children}
    </div>
  )
}

export function Tag({ children, color = '#1f6feb' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', background: color + '33',
      color, fontSize: 12, fontWeight: 600,
      padding: '2px 8px', borderRadius: 12, margin: '0 4px 4px 0',
    }}>{children}</span>
  )
}

export function DemoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#161b22', border: '1px solid #30363d',
      borderRadius: 12, padding: 24, marginTop: 8,
    }}>
      {children}
    </div>
  )
}
