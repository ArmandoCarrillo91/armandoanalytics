'use client'

import { useState } from 'react'
import TallerSidebar from './TallerSidebar'

export default function TallerShell({ children, otherTenants = [], isPlatformAdmin, userRole }: { children: React.ReactNode; otherTenants?: { slug: string; name: string }[]; isPlatformAdmin?: boolean; userRole?: string | null }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="taller-shell">
      {/* Mobile overlay */}
      <div
        className={`taller-overlay${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`taller-sidebar${open ? ' open' : ''}`}>
        <TallerSidebar onNavigate={() => setOpen(false)} otherTenants={otherTenants} isPlatformAdmin={isPlatformAdmin} userRole={userRole} />
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
