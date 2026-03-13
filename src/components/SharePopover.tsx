'use client'

import { useState, useRef, useEffect } from 'react'
import { toggleDashboardShare } from '@/app/actions/dashboards'

interface SharePopoverProps {
  dashboardId: string
  dashboardName: string
  isPublic: boolean
  publicToken: string | null
  expiresAt: string | null
  onUpdate: (isPublic: boolean, token: string | null, expiresAt: string | null) => void
}

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

export default function SharePopover({
  dashboardId,
  dashboardName,
  isPublic,
  publicToken,
  expiresAt,
  onUpdate,
}: SharePopoverProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
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

  async function handleToggle() {
    setLoading(true)
    try {
      const result = await toggleDashboardShare(
        dashboardId,
        isPublic ? 'disable' : 'enable'
      )
      onUpdate(result.is_public, result.public_token, result.public_token_expires_at)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleRenew() {
    setLoading(true)
    try {
      const result = await toggleDashboardShare(dashboardId, 'renew')
      onUpdate(result.is_public, result.public_token, result.public_token_expires_at)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const shareUrl = publicToken
    ? `${window.location.origin}/share/${publicToken}`
    : ''

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
          padding: '4px 10px',
          fontSize: '12px',
          background: 'transparent',
          border: '1px solid var(--border-light)',
          borderRadius: '4px',
          color: 'var(--text-gray)',
          cursor: 'pointer',
        }}
      >
        Compartir
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            width: '320px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-light)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-popover)',
            padding: '16px',
            zIndex: 50,
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '12px',
              color: 'var(--text-black)',
            }}
          >
            Compartir &ldquo;{dashboardName}&rdquo;
          </div>

          {/* Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
              Link p&uacute;blico
            </span>
            <button
              onClick={handleToggle}
              disabled={loading}
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                border: 'none',
                background: isPublic ? '#10B981' : 'var(--text-muted)',
                cursor: loading ? 'not-allowed' : 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: isPublic ? '20px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          {/* Link display */}
          {isPublic && publicToken && (
            <div>
              <div
                style={{
                  padding: '8px 10px',
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: 'var(--text-gray)',
                  wordBreak: 'break-all',
                  marginBottom: '8px',
                }}
              >
                {shareUrl}
              </div>

              {/* Expiration info */}
              {expiresAt && (
                <div
                  style={{
                    fontSize: '11px',
                    color: new Date(expiresAt) < new Date() ? '#EF4444' : 'var(--text-gray)',
                    marginBottom: '8px',
                  }}
                >
                  {new Date(expiresAt) < new Date()
                    ? 'Link expirado'
                    : formatExpiry(expiresAt)}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: 'var(--text-black)',
                    color: 'var(--bg-light)',
                    border: 'none',
                    borderRadius: '6px',
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
                    fontSize: '12px',
                    fontWeight: 500,
                    background: 'transparent',
                    color: 'var(--text-black)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Renovar 24h
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
