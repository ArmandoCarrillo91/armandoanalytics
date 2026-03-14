'use client'

import { useState } from 'react'
import { toggleDashboardShare } from '@/app/actions/dashboards'

const DASHBOARD_ID = 'e3af77ce-ac39-475d-b040-8626b17f3598'

export default function SidebarPulsoShare() {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return

    setLoading(true)
    try {
      const result = await toggleDashboardShare(DASHBOARD_ID, 'enable')
      if (result.public_token) {
        const url = `${window.location.origin}/share/${result.public_token}`
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', marginLeft: 'auto' }}>
      <button
        className="pulso-share-icon"
        onClick={handleShare}
        disabled={loading}
        title={copied ? 'Link copiado \u00b7 v\u00e1lido 24 hrs' : 'Compartir Pulso'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: copied ? 'var(--taller-green)' : 'var(--taller-muted)',
          transition: 'color 0.15s, opacity 0.15s',
          opacity: loading ? 0.5 : 1,
        }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = 'var(--taller-green)' }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = 'var(--taller-muted)' }}
      >
        {loading ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'sidebar-spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : copied ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>
      <style>{`@keyframes sidebar-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
