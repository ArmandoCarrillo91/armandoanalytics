'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  dashboardSlug: string
  tenantId: string
  tenantName: string
  dashboardName: string
}

const BASE_URL = 'https://aa.mx'

export default function SharePopover({ dashboardSlug, tenantId, tenantName, dashboardName }: Props) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  // Personal invite state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [expiresIn, setExpiresIn] = useState('168')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!open) return
    fetchPublicLink()
  }, [open])

  async function fetchPublicLink() {
    const res = await fetch('/api/share/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, dashboardSlug, type: 'public' }),
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      setViewCount(data.viewCount ?? 0)
      setCreatedAt(data.createdAt ?? null)
    }
  }

  const shareUrl = token ? `${BASE_URL}/share/${token}` : ''

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePersonalLink() {
    setGenerating(true)
    const res = await fetch('/api/share/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId, dashboardSlug, type: 'personal',
        recipientEmail: email, recipientName: name,
        expiresIn: expiresIn === 'null' ? null : Number(expiresIn),
      }),
    })
    const data = await res.json()
    if (data.token) {
      navigator.clipboard.writeText(`${BASE_URL}/share/${data.token}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setEmail('')
      setName('')
    }
    setGenerating(false)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'hace menos de 1h'
    if (h < 24) return `hace ${h}h`
    return `hace ${Math.floor(h / 24)}d`
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8,
    border: '1px solid var(--border-light)', background: 'var(--bg-light)',
    color: 'var(--text-black)', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        padding: '6px 12px', fontSize: 13, fontWeight: 500, borderRadius: 8,
        border: '1px solid var(--border-light)', background: 'var(--bg-light)',
        color: 'var(--text-black)', cursor: 'pointer', display: 'flex',
        alignItems: 'center', gap: 6,
      }}>
        <ShareIcon /> Compartir
      </button>

      {open && (
        <>
          <div onClick={() => { setOpen(false); setShowQR(false) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 90 }} />

          <div style={{
            position: 'absolute', top: 40, right: 0, width: 340, zIndex: 91,
            background: 'var(--bg-light)', borderRadius: 12,
            border: '1px solid var(--border-light)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: 16,
          }}>
            {/* SECTION 1 — Active link */}
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-gray)', margin: '0 0 8px' }}>
              Link público
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} style={{
                flex: 1, padding: '7px 10px', fontSize: 12, borderRadius: 8,
                border: '1px solid var(--border-light)', background: 'var(--bg-hover)',
                color: 'var(--text-black)', boxSizing: 'border-box',
              }} />
              <button onClick={handleCopy} style={{
                padding: '7px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8,
                border: 'none', background: 'var(--accent)', color: '#fff',
                cursor: 'pointer', minWidth: 64,
              }}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <ShareGrid shareUrl={shareUrl} dashboardName={dashboardName}
              showQR={showQR} setShowQR={setShowQR} />
            {showQR && token && (
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
                <QRCodeSVG value={shareUrl} size={140} />
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-light)', margin: '14px 0' }} />

            {/* SECTION 2 — Personal invite */}
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-gray)', margin: '0 0 8px' }}>
              Invitación personal
            </p>
            <input placeholder="Email del destinatario" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ ...inp, marginBottom: 8 }} />
            <input placeholder="Nombre (opcional)" value={name}
              onChange={(e) => setName(e.target.value)} style={{ ...inp, marginBottom: 8 }} />
            <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)}
              style={{ ...inp, marginBottom: 10 }}>
              <option value="24">24 horas</option>
              <option value="168">7 días</option>
              <option value="720">30 días</option>
              <option value="null">Sin expiración</option>
            </select>
            <button onClick={handlePersonalLink} disabled={!email || generating} style={{
              width: '100%', padding: '8px 0', fontSize: 13, fontWeight: 500, borderRadius: 8,
              border: 'none', background: !email ? 'var(--bg-hover)' : 'var(--accent)',
              color: !email ? 'var(--text-muted)' : '#fff',
              cursor: email ? 'pointer' : 'default',
            }}>
              {generating ? 'Generando...' : 'Generar link personal'}
            </button>

            <div style={{ borderTop: '1px solid var(--border-light)', margin: '14px 0' }} />

            {/* SECTION 3 — Footer */}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {viewCount} visitas{createdAt ? ` · creado ${timeAgo(createdAt)}` : ''}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function ShareGrid({ shareUrl, dashboardName, showQR, setShowQR }: any) {
  const wa = `https://wa.me/?text=${encodeURIComponent(`${dashboardName}: ${shareUrl}`)}`
  const mail = `mailto:?subject=${encodeURIComponent(dashboardName)}&body=${encodeURIComponent(shareUrl)}`
  const btn: React.CSSProperties = {
    padding: '8px 0', fontSize: 12, fontWeight: 500, borderRadius: 8,
    border: '1px solid var(--border-light)', background: 'var(--bg-light)',
    color: 'var(--text-black)', cursor: 'pointer',
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
      <button style={btn} onClick={() => window.open(wa, '_blank')}>WhatsApp</button>
      <button style={btn} onClick={() => window.open(mail)}>Email</button>
      <button style={btn} onClick={() => setShowQR(!showQR)}>QR</button>
      <button style={btn} onClick={() => {
        if (navigator.share) navigator.share({ title: dashboardName, url: shareUrl })
      }}>Más</button>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}
