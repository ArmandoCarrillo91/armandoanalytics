'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import InviteUserModal from '@/components/InviteUserModal'
import TallerThemeToggle from './TallerThemeToggle'
import SidebarPulsoShare from './SidebarPulsoShare'

const NAV_ITEMS = [
  { label: 'Pulso', href: '/dashboard/taller', icon: '♡' },
]

export default function TallerSidebar({ onNavigate, otherTenants = [], isPlatformAdmin, userRole }: { onNavigate?: () => void; otherTenants?: { slug: string; name: string }[]; isPlatformAdmin?: boolean; userRole?: string | null }) {
  console.log('isPlatformAdmin:', isPlatformAdmin)
  const pathname = usePathname()
  const router = useRouter()
  const [showInvite, setShowInvite] = useState(false)

  async function handleLogout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect x=".5" y=".5" width="33" height="33" rx="9"
              stroke="var(--logo-rect-stroke)" fill="var(--logo-rect-fill)" />
            <text x="17" y="17" textAnchor="middle" dominantBaseline="central"
              fontSize="20" fontWeight="800" fill="var(--logo-text-fill)"
              fontFamily="JetBrains Mono, SF Mono, monospace">A</text>
          </svg>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--taller-ink)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.3px',
            }}
          >
            armandoanalytics
          </span>
        </div>
      </div>

      {/* Taller Rafa section */}
      <nav style={{ flex: 1, paddingTop: 4 }}>
        <div
          style={{
            padding: '0 20px',
            marginBottom: 8,
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--taller-muted)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase' as const,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Taller Rafa
        </div>

        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const canShare = item.label === 'Pulso' && (userRole === 'admin' || userRole === 'editor')

          const linkStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 20px',
            fontSize: 13,
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--taller-green)' : 'var(--taller-ink)',
            background: active ? 'rgba(45, 106, 79, 0.08)' : 'transparent',
            borderLeft: `3px solid ${active ? 'var(--taller-green)' : 'transparent'}`,
            textDecoration: 'none',
            transition: 'background 0.15s, color 0.15s',
            fontFamily: "'IBM Plex Mono', monospace",
            flex: 1,
          }

          const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
            if (!active) e.currentTarget.style.background = 'rgba(45, 106, 79, 0.04)'
          }
          const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
            if (!active) e.currentTarget.style.background = 'transparent'
          }

          if (canShare) {
            return (
              <div
                key={item.href}
                className="pulso-nav-wrapper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: active ? 'rgba(45, 106, 79, 0.08)' : 'transparent',
                  borderLeft: `3px solid ${active ? 'var(--taller-green)' : 'transparent'}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(45, 106, 79, 0.04)' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  style={{
                    ...linkStyle,
                    background: 'transparent',
                    borderLeft: 'none',
                  }}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                >
                  <span style={{ fontSize: 14, opacity: active ? 1 : 0.5 }}>{item.icon}</span>
                  {item.label}
                </Link>
                <div style={{ paddingRight: 12 }}>
                  <SidebarPulsoShare />
                </div>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              style={linkStyle}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              <span style={{ fontSize: 14, opacity: active ? 1 : 0.5 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {/* Otros tenants — only if user has access to more than taller */}
        {otherTenants.length > 0 && (
          <>
            <div
              style={{
                padding: '0 20px',
                marginTop: 28,
                marginBottom: 8,
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--taller-muted)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase' as const,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Otros tenants
            </div>

            {otherTenants.map((t) => (
              <Link
                key={t.slug}
                href={`/dashboard/${t.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 20px',
                  fontSize: 13,
                  fontWeight: 400,
                  color: 'var(--taller-ink)',
                  background: 'transparent',
                  borderLeft: '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45, 106, 79, 0.04)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {t.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Invite button (admin only) */}
      {isPlatformAdmin && (
        <div style={{ padding: '0 20px 8px' }}>
          <button
            onClick={() => setShowInvite(true)}
            style={{
              width: '100%',
              padding: '7px 0',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 8,
              border: '1px dashed var(--taller-border)',
              background: 'transparent',
              color: 'var(--taller-muted)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(45, 106, 79, 0.08)'
              e.currentTarget.style.color = 'var(--taller-ink)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--taller-muted)'
            }}
          >
            + Invitar usuario
          </button>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--taller-border)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--taller-green)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: 'var(--taller-muted)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            taller · en línea
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TallerThemeToggle />
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
            color: 'var(--taller-muted)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--taller-ink)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--taller-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
        </div>
      </div>
      {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} tenantSlug="taller" />}
    </div>
  )
}
