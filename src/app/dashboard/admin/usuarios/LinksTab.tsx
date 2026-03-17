'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShareLink {
  id: string
  dashboard_slug: string
  type: 'public' | 'personal'
  recipient_email: string | null
  recipient_name: string | null
  expires_at: string | null
  view_count: number
  last_viewed_at: string | null
  created_at: string
}

export default function LinksTab({ platformRole, tenantId }: { platformRole: string; tenantId: string }) {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    fetchLinks()
  }, [tenantId])

  async function fetchLinks() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('share_links')
      .select('id, dashboard_slug, type, recipient_email, recipient_name, expires_at, view_count, last_viewed_at, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    setLinks(data ?? [])
    setLoading(false)
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function isExpired(iso: string | null) {
    if (!iso) return false
    return new Date(iso) < new Date()
  }

  const pill = (type: 'public' | 'personal'): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500,
    background: type === 'public' ? '#E6F1FB' : '#EEEDFE',
    color: type === 'public' ? '#0C447C' : '#3C3489',
  })

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '10px 14px', fontWeight: 500, color: 'var(--text-gray)',
  }
  const td: React.CSSProperties = { padding: '10px 14px', color: 'var(--text-black)' }

  return (
    <div>
      <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover)' }}>
              <th style={th}>Dashboard</th>
              <th style={th}>Tipo</th>
              <th style={th}>Destinatario</th>
              <th style={th}>Expira</th>
              <th style={{ ...th, textAlign: 'right' }}>Visitas</th>
              <th style={th}>Último acceso</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</td></tr>
            )}
            {!loading && links.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text-muted)' }}>Sin links compartidos</td></tr>
            )}
            {links.map((l) => (
              <tr key={l.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                <td style={td}>{l.dashboard_slug}</td>
                <td style={td}>
                  <span style={pill(l.type)}>
                    {l.type === 'public' ? 'Público' : 'Personal'}
                  </span>
                </td>
                <td style={{ ...td, color: 'var(--text-gray)' }}>
                  {l.recipient_name || l.recipient_email || '—'}
                </td>
                <td style={{ ...td, color: isExpired(l.expires_at) ? 'var(--error-fg)' : 'var(--text-gray)' }}>
                  {l.expires_at ? (isExpired(l.expires_at) ? 'Expirado' : formatDate(l.expires_at)) : 'Sin expiración'}
                </td>
                <td style={{ ...td, textAlign: 'right' }}>{l.view_count}</td>
                <td style={{ ...td, color: 'var(--text-gray)' }}>{formatDate(l.last_viewed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
