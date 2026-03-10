'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const workspaceNames: Record<string, string> = {
  taller: 'Taller',
  energy: 'Energy',
}

function TopBarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const segments = pathname.split('/')
  const slug = segments[2] ?? ''
  const name = workspaceNames[slug] ?? slug
  const dashboardId = searchParams.get('d')

  function handleNewChart() {
    const url = dashboardId
      ? `/dashboard/${slug}/new-chart?d=${dashboardId}`
      : `/dashboard/${slug}/new-chart`
    router.push(url)
  }

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
        onClick={handleNewChart}
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
