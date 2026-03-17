'use client'

import { useState } from 'react'

interface Tenant {
  id: string
  slug: string
  name: string
  connectionType: string
  isActive: boolean
}

const typePill = (type: string) => ({
  display: 'inline-block' as const,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 500,
  borderRadius: 99,
  background: type === 'supabase' ? '#EEEDFE' : '#F1EFE8',
  color: type === 'supabase' ? '#3C3489' : '#444441',
})

const activePill = {
  display: 'inline-block' as const,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 500,
  borderRadius: 99,
  background: '#E1F5EE',
  color: '#0F6E56',
}

export default function TenantsView({ tenants }: { tenants: Tenant[] }) {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newType, setNewType] = useState('supabase')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-black)', margin: 0 }}>Tenants</h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 8,
            border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
          }}
        >
          + Nuevo tenant
        </button>
      </div>

      <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover)' }}>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, color: 'var(--text-gray)' }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, color: 'var(--text-gray)' }}>Tipo</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, color: 'var(--text-gray)' }}>Estado</th>
              <th style={{ width: 48, padding: '10px 14px' }} />
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-black)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.slug}</div>
                </td>
                <td style={{ padding: '10px 14px' }}><span style={typePill(t.connectionType)}>{t.connectionType}</span></td>
                <td style={{ padding: '10px 14px' }}>
                  {t.isActive && <span style={activePill}>activo</span>}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>···</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-light)', borderRadius: 12, padding: 24,
              width: 400, maxWidth: '90vw', border: '1px solid var(--border-light)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-black)' }}>Nuevo tenant</h3>
            <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 4 }}>Nombre</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 8,
                border: '1px solid var(--border-light)', background: 'var(--bg-light)',
                color: 'var(--text-black)', marginBottom: 12, boxSizing: 'border-box',
              }}
            />
            <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 4 }}>Slug</label>
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 8,
                border: '1px solid var(--border-light)', background: 'var(--bg-light)',
                color: 'var(--text-black)', marginBottom: 12, boxSizing: 'border-box',
              }}
            />
            <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 4 }}>Tipo de conexión</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8,
                border: '1px solid var(--border-light)', background: 'var(--bg-light)',
                color: 'var(--text-black)', marginBottom: 16,
              }}
            >
              <option value="supabase">Supabase</option>
              <option value="postgres">Postgres</option>
            </select>
            <button
              onClick={() => { console.log('create tenant', { newName, newSlug, newType }); setShowModal(false) }}
              style={{
                width: '100%', padding: '8px 0', fontSize: 13, fontWeight: 500, borderRadius: 8,
                border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
              }}
            >
              Crear tenant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
