'use client'

import { usePathname } from 'next/navigation'

const workspaceNames: Record<string, string> = {
  taller: 'Taller',
  energy: 'Energy',
}

export default function TopBar() {
  const pathname = usePathname()
  const segments = pathname.split('/')
  const slug = segments[2] ?? ''
  const name = workspaceNames[slug] ?? slug

  return (
    <div
      style={{
        height: 48,
        minHeight: 48,
        background: 'var(--bg-light)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-black)' }}>
        {name}
      </span>
      <button
        style={{
          width: 28,
          height: 28,
          border: '1px solid var(--border-light)',
          borderRadius: 6,
          background: 'transparent',
          color: 'var(--text-gray)',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        +
      </button>
    </div>
  )
}
