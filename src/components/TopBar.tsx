'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'

const workspaceNames: Record<string, string> = {
  taller: 'Taller',
  energy: 'Energy',
}

function TopBarContent() {
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
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-black)' }}>
        {name}
      </span>
    </div>
  )
}

export default function TopBar() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: 48,
            minHeight: 48,
            background: 'var(--bg-light)',
            borderBottom: '1px solid var(--border-light)',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-black)' }}>
            &nbsp;
          </span>
        </div>
      }
    >
      <TopBarContent />
    </Suspense>
  )
}
