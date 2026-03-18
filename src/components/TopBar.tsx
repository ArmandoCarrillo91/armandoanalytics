'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'

const workspaceNames: Record<string, string> = {
  taller: 'Taller',
  energy: 'Energy',
}

function EnergyTopBar() {
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <style>{`@keyframes energyPulse { 0%, 100% { opacity: 1; box-shadow: 0 0 6px #C8A415; } 50% { opacity: 0.3; box-shadow: none; } }`}</style>
      <div
        style={{
          height: 48,
          minHeight: 48,
          background: '#111',
          borderBottom: '1px solid #222',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#C8A415',
              animation: 'energyPulse 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#F0EEE8',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            Energy Cycle Studio{' '}
            <span style={{ color: '#555', fontWeight: 400 }}>· Pulso</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Día', 'Semana', 'Mes', 'Año'].map((p, i) => (
              <button
                key={p}
                style={{
                  background: i === 0 ? '#C8A415' : 'transparent',
                  color: i === 0 ? '#111' : '#555',
                  border: i === 0 ? 'none' : '1px solid #333',
                  borderRadius: 4,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <span
            style={{
              fontSize: 12,
              color: '#555',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            {today}
          </span>
        </div>
      </div>
    </>
  )
}

function TopBarContent() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/dashboard/admin')
  const segments = pathname.split('/')
  const slug = segments[2] ?? ''

  if (slug === 'energy') return <EnergyTopBar />

  const name = isAdmin ? '' : (workspaceNames[slug] ?? slug)

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
