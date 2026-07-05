import React from 'react'

interface Props {
  badge: string
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function PageLayout({ badge, title, subtitle, children }: Props) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <span style={{
          display: 'inline-block', background: '#1f6feb', color: '#58a6ff',
          fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          padding: '3px 10px', borderRadius: 20, marginBottom: 12,
        }}>{badge}</span>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#f0f6fc', lineHeight: 1.2 }}>{title}</h1>
        <p style={{ fontSize: 16, color: '#8b949e', marginTop: 8 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
