'use client'

import { useState, useRef, useEffect } from 'react'
import { toggleDashboardShare } from '@/app/actions/dashboards'

const DASHBOARD_ID = 'e3af77ce-ac39-475d-b040-8626b17f3598'

function formatExpiry(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const month = months[d.getMonth()]
  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `Expira el ${day} ${month} a las ${h12}:${minutes} ${ampm}`
}

interface Props {
  initialIsPublic: boolean
  initialToken: string | null
  initialExpiresAt: string | null
}

export default function PulsoShareButton({ initialIsPublic, initialToken, initialExpiresAt }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [publicToken, setPublicToken] = useState(initialToken)
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleUpdate(newIsPublic: boolean, token: string | null, expires: string | null) {
    setIsPublic(newIsPublic)
    setPublicToken(token)
    setExpiresAt(expires)
  }

  async function handleToggle() {
    setLoading(true)
    try {
      const result = await toggleDashboardShare(DASHBOARD_ID, isPublic ? 'disable' : 'enable')
      handleUpdate(result.is_public, result.public_token, result.public_token_expires_at)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleRenew() {
    setLoading(true)
    try {
      const result = await toggleDashboardShare(DASHBOARD_ID, 'renew')
      handleUpdate(result.is_public, result.public_token, result.public_token_expires_at)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const shareUrl = publicToken ? `${window.location.origin}/share/${publicToken}` : ''

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'var(--taller-font-m)',
          background: 'var(--taller-surface)',
          border: '1px solid var(--taller-border)',
          borderRadius: 6,
          color: 'var(--taller-muted)',
          cursor: 'pointer',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--taller-ink)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--taller-muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        Compartir
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            width: 320,
            background: 'var(--taller-surface)',
            border: '1px solid var(--taller-border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-popover)',
            padding: 16,
            zIndex: 50,
            fontFamily: 'var(--taller-font-m)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-d)' }}>
            Compartir &ldquo;Pulso&rdquo;
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--taller-muted)' }}>
              Link p&uacute;blico
            </span>
            <button
              onClick={handleToggle}
              disabled={loading}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                border: 'none',
                background: isPublic ? 'var(--taller-green)' : 'var(--taller-muted)',
                cursor: loading ? 'not-allowed' : 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 2,
                left: isPublic ? 20 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {isPublic && publicToken ? (
            <div>
              <div style={{
                padding: '8px 10px',
                background: 'var(--taller-bg)',
                border: '1px solid var(--taller-border)',
                borderRadius: 6,
                fontSize: 11,
                color: 'var(--taller-ink)',
                wordBreak: 'break-all',
                marginBottom: 8,
              }}>
                {shareUrl}
              </div>

              {expiresAt && (
                <div style={{
                  fontSize: 11,
                  color: new Date(expiresAt) < new Date() ? '#EF4444' : 'var(--taller-muted)',
                  marginBottom: 8,
                }}>
                  {new Date(expiresAt) < new Date() ? 'Link expirado' : formatExpiry(expiresAt)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: 'var(--taller-font-m)',
                    background: 'var(--taller-green)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? 'Copiado!' : 'Copiar link'}
                </button>
                <button
                  onClick={handleRenew}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: 'var(--taller-font-m)',
                    background: 'transparent',
                    color: 'var(--taller-ink)',
                    border: '1px solid var(--taller-border)',
                    borderRadius: 6,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Renovar 24h
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--taller-muted)', margin: 0 }}>
              Activa el link para compartir
            </p>
          )}
        </div>
      )}
    </div>
  )
}
