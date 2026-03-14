'use client'

import { useState, useRef, useEffect } from 'react'
import { toggleDashboardShare } from '@/app/actions/dashboards'

const DASHBOARD_ID = 'e3af77ce-ac39-475d-b040-8626b17f3598'

interface Props {
  initialIsPublic: boolean
  initialToken: string | null
}

export default function PulsoShareButton({ initialIsPublic, initialToken }: Props) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasActiveToken, setHasActiveToken] = useState(initialIsPublic && !!initialToken)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleShare() {
    setLoading(true)
    try {
      const result = await toggleDashboardShare(DASHBOARD_ID, 'enable')
      if (result.public_token) {
        const url = `${window.location.origin}/share/${result.public_token}`
        await navigator.clipboard.writeText(url)
        setHasActiveToken(true)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setMenuOpen(false)
    setLoading(true)
    try {
      await toggleDashboardShare(DASHBOARD_ID, 'disable')
      setHasActiveToken(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={handleShare}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'var(--taller-font-m)',
          background: copied ? 'var(--taller-green)' : 'var(--taller-accent-primary)',
          border: '1px solid ' + (copied ? 'var(--taller-green)' : 'var(--taller-accent-primary)'),
          borderRadius: 6,
          color: '#ffffff',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s, border-color 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'pulso-spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
        {copied ? 'Link copiado \u00b7 v\u00e1lido 24 hrs' : 'Compartir'}
      </button>

      {hasActiveToken && (
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              background: 'transparent',
              border: '1px solid var(--taller-border)',
              borderRadius: 6,
              color: 'var(--taller-muted)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--taller-ink)'; e.currentTarget.style.borderColor = 'var(--taller-ink)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--taller-muted)'; e.currentTarget.style.borderColor = 'var(--taller-border)' }}
          >
            &middot;&middot;&middot;
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: 'var(--taller-surface)',
              border: '1px solid var(--taller-border)',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 50,
              minWidth: 160,
              overflow: 'hidden',
            }}>
              <button
                onClick={handleDisable}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 12,
                  fontFamily: 'var(--taller-font-m)',
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Desactivar link
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes pulso-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
