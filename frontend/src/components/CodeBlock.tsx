import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'

interface Props {
  code: string
  language?: string
  label?: string
}

export default function CodeBlock({ code, language = 'json', label }: Props) {
  return (
    <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #30363d' }}>
      {label && (
        <div style={{
          background: '#21262d', padding: '6px 14px',
          fontSize: 11, color: '#8b949e', fontFamily: 'monospace',
          borderBottom: '1px solid #30363d',
        }}>{label}</div>
      )}
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        customStyle={{ margin: 0, padding: '16px', fontSize: 13, background: '#0d1117' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
