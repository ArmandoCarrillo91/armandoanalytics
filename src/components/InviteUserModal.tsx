'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Tenant {
  id: string
  name: string
}

export default function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchTenants() {
      const supabase = createClient()
      const { data } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (data) {
        setTenants(data)
        if (data.length > 0) setTenantId(data[0].id)
      }
    }
    fetchTenants()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenant_id: tenantId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al invitar usuario')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: 380,
          maxWidth: '90vw',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--text-black)' }}>
          Invitar usuario
        </h2>

        {success && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: '#ECFDF5',
            color: '#065F46',
            fontSize: 13,
            marginBottom: 16,
          }}>
            Usuario invitado correctamente
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: '#FEF2F2',
            color: '#991B1B',
            fontSize: 13,
            marginBottom: 16,
            wordBreak: 'break-word',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-gray)', display: 'block', marginBottom: 4 }}>
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-gray)', display: 'block', marginBottom: 4 }}>
              Contraseña
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-gray)', display: 'block', marginBottom: 4 }}>
              Tenant
            </span>
            <select
              required
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                outline: 'none',
                background: '#fff',
                boxSizing: 'border-box',
              }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                border: '1px solid var(--border-light)',
                background: '#fff',
                color: 'var(--text-gray)',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                cursor: loading || success ? 'not-allowed' : 'pointer',
                opacity: loading || success ? 0.6 : 1,
              }}
            >
              {loading ? 'Invitando...' : 'Invitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
