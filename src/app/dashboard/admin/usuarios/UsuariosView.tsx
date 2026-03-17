'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UsuariosTab from './UsuariosTab'
import LinksTab from './LinksTab'

interface Tenant { slug: string; name: string; id: string }
interface User { id: string; email: string; full_name: string | null; platform_role: string; role: string }

export default function UsuariosView({
  tenants,
  selectedSlug,
  selectedTenantId,
  users,
  platformRole,
}: {
  tenants: Tenant[]
  selectedSlug: string
  selectedTenantId: string
  users: User[]
  platformRole: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'usuarios' | 'links'>('usuarios')

  return (
    <div>
      {/* Tenant selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-black)', margin: 0 }}>
          Usuarios
        </h1>
        <select
          value={selectedSlug}
          onChange={(e) => router.push(`/dashboard/admin/usuarios?tenant=${e.target.value}`)}
          style={{
            padding: '6px 10px',
            fontSize: 13,
            borderRadius: 8,
            border: '1px solid var(--border-light)',
            background: 'var(--bg-light)',
            color: 'var(--text-black)',
            cursor: 'pointer',
          }}
        >
          {tenants.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-light)', marginBottom: 20 }}>
        {(['usuarios', 'links'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: tab === t ? 500 : 400,
              color: tab === t ? 'var(--text-black)' : 'var(--text-gray)',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {t === 'usuarios' ? 'Usuarios' : 'Links compartidos'}
          </button>
        ))}
      </div>

      {tab === 'usuarios'
        ? <UsuariosTab users={users} platformRole={platformRole} />
        : <LinksTab platformRole={platformRole} tenantId={selectedTenantId} />}
    </div>
  )
}
