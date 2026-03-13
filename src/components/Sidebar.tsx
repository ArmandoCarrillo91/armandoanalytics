'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import InviteUserModal from '@/components/InviteUserModal'

interface Tenant {
  slug: string
  name: string
}

export default function Sidebar({ tenants, email, isPlatformAdmin }: { tenants: Tenant[]; email: string; isPlatformAdmin?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [showInvite, setShowInvite] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        height: '100vh',
        background: 'var(--bg-light)',
        borderRight: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="var(--accent)" />
          <text
            x="14" y="14"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="16"
            fontWeight="800"
            fill="white"
            fontFamily="Inter, sans-serif"
          >A</text>
        </svg>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-black)',
            letterSpacing: '-0.3px',
          }}
        >
          armandoanalytics
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8 }}>
        <div
          style={{
            padding: '0 16px',
            marginBottom: 6,
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--text-muted)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase' as const,
          }}
        >
          Workspaces
        </div>
        {tenants.map((t) => {
          const href = `/dashboard/${t.slug}`
          const active = pathname.startsWith(href)
          return (
            <Link
              key={t.slug}
              href={href}
              style={{
                display: 'block',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--text-black)' : 'var(--text-gray)',
                background: active ? '#F4F4F5' : 'transparent',
                borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#F4F4F5'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              {t.name}
            </Link>
          )
        })}
      </nav>

      {/* Invite button (admin only) */}
      {isPlatformAdmin && (
        <div style={{ padding: '0 16px 8px' }}>
          <button
            onClick={() => setShowInvite(true)}
            style={{
              width: '100%',
              padding: '7px 0',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 8,
              border: '1px dashed var(--border-light)',
              background: 'transparent',
              color: 'var(--text-gray)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F4F4F5'
              e.currentTarget.style.color = 'var(--text-black)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-gray)'
            }}
          >
            + Invitar usuario
          </button>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border-light)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--text-black)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-gray)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {email}
        </span>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--text-muted)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-black)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
      {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} />}
    </aside>
  )
}
