'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

interface Tenant {
  slug: string
  name: string
}

export default function Sidebar({ tenants, email, platformRole }: { tenants: Tenant[]; email: string; platformRole: string }) {
  const pathname = usePathname()
  const router = useRouter()
  async function handleLogout() {
    const supabase = await createClient()
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
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <rect x=".5" y=".5" width="33" height="33" rx="9"
            stroke="var(--logo-rect-stroke)" fill="var(--logo-rect-fill)" />
          <text x="17" y="17" textAnchor="middle" dominantBaseline="central"
            fontSize="20" fontWeight="800" fill="var(--logo-text-fill)"
            fontFamily="JetBrains Mono, SF Mono, monospace">A</text>
        </svg>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-black)',
            fontFamily: "'JetBrains Mono', monospace",
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
                background: active ? 'var(--bg-hover)' : 'transparent',
                borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--bg-hover)'
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

      {/* Admin nav (owner and viewer) */}
      {(platformRole === 'owner' || platformRole === 'viewer') && (
        <nav style={{ paddingBottom: 8 }}>
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
            Admin
          </div>
          {([
            { href: '/dashboard/admin/tenants', label: 'Tenants', ownerOnly: true },
            { href: '/dashboard/admin/usuarios', label: 'Usuarios', ownerOnly: false },
            { href: '/dashboard/admin/configuracion', label: 'Configuración', ownerOnly: true },
          ] as const).filter((item) => !item.ownerOnly || platformRole === 'owner').map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'block',
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  color: active ? 'var(--text-black)' : 'var(--text-gray)',
                  background: active ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>
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
            color: 'var(--bg-light)',
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
        <ThemeToggle />
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
    </aside>
  )
}
