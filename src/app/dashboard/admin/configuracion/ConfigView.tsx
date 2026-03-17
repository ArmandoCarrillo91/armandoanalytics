'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tenant { slug: string; name: string }

export default function ConfigView({
  tenants,
  selectedSlug,
  tenantName,
}: {
  tenants: Tenant[]
  selectedSlug: string
  tenantName: string
}) {
  const router = useRouter()
  const [name, setName] = useState(tenantName)
  const [theme, setTheme] = useState('system')
  const [shareableLinks, setShareableLinks] = useState(true)
  const [emailInvites, setEmailInvites] = useState(true)
  const [publicMode, setPublicMode] = useState(false)

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid var(--border-light)',
    background: 'var(--bg-light)',
    color: 'var(--text-black)',
    boxSizing: 'border-box' as const,
  }

  const sectionTitle = {
    fontSize: 14,
    fontWeight: 600 as const,
    color: 'var(--text-black)',
    marginBottom: 12,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-black)', margin: 0 }}>
          Configuración
        </h1>
        <select
          value={selectedSlug}
          onChange={(e) => router.push(`/dashboard/admin/configuracion?tenant=${e.target.value}`)}
          style={{
            padding: '6px 10px', fontSize: 13, borderRadius: 8,
            border: '1px solid var(--border-light)', background: 'var(--bg-light)',
            color: 'var(--text-black)', cursor: 'pointer',
          }}
        >
          {tenants.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </div>

      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Tenant name */}
        <div>
          <div style={sectionTitle}>Tenant</div>
          <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 4 }}>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>

        {/* Theme */}
        <div>
          <div style={sectionTitle}>Apariencia</div>
          <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 4 }}>Tema</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={inputStyle}>
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </div>

        {/* Feature toggles */}
        <div>
          <div style={sectionTitle}>Funcionalidades</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              { label: 'Links compartibles', value: shareableLinks, set: setShareableLinks },
              { label: 'Invitaciones por correo', value: emailInvites, set: setEmailInvites },
              { label: 'Modo público', value: publicMode, set: setPublicMode },
            ] as const).map(({ label, value, set }) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: 'var(--text-black)' }}>{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  onClick={() => set(!value)}
                  style={{
                    width: 36, height: 20, borderRadius: 10, padding: 2,
                    border: 'none', cursor: 'pointer',
                    background: value ? 'var(--accent)' : 'var(--border-light)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: value ? 'flex-end' : 'flex-start',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  }} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={() => console.log('save config', { name, theme, shareableLinks, emailInvites, publicMode })}
          style={{
            padding: '10px 0', fontSize: 13, fontWeight: 500, borderRadius: 8,
            border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
            alignSelf: 'flex-start', paddingLeft: 24, paddingRight: 24,
          }}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
