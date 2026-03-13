'use client'

import { useState } from 'react'
import TallerSidebar from './TallerSidebar'

export default function TallerShell({ children, otherTenants = [] }: { children: React.ReactNode; otherTenants?: { slug: string; name: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="taller-shell"
      style={{
        '--taller-bg': '#f4f2ed',
        '--taller-surface': '#ffffff',
        '--taller-border': '#e5e1d8',
        '--taller-ink': '#1a1814',
        '--taller-green': '#2d6a4f',
        '--taller-red': '#c94a4a',
        '--taller-amber': '#c9942a',
        '--taller-blue': '#0070f3',
        '--taller-blue-l': '#eff6ff',
        '--taller-blue-m': '#3b82f6',
        '--taller-muted': '#97928a',
        '--taller-font-m': "'IBM Plex Mono', monospace",
        '--taller-font-d': "'Lora', serif",
      } as React.CSSProperties}
    >
      {/* Mobile overlay */}
      <div
        className={`taller-overlay${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`taller-sidebar${open ? ' open' : ''}`}>
        <TallerSidebar onNavigate={() => setOpen(false)} otherTenants={otherTenants} />
      </aside>

      {/* Main content */}
      <main className="taller-main">
        {/* Mobile hamburger — sits at top of content */}
        <button
          className="taller-hamburger"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          style={{ marginBottom: 16 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {children}
      </main>
    </div>
  )
}
