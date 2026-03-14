'use client'

import { useState, useEffect } from 'react'
import { getDashboards, createDashboard, getUserTenantRole } from '@/app/actions/dashboards'
import SharePopover from '@/components/SharePopover'

export default function TallerPage() {
  const [dashboards, setDashboards] = useState<any[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getDashboards('taller'),
      getUserTenantRole('taller'),
    ])
      .then(([dbs, role]) => {
        setDashboards(dbs)
        setUserRole(role)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      const d = await createDashboard('taller', name.trim())
      setDashboards(prev => [d, ...prev])
      setName('')
    } catch (e: any) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  function handleShareUpdate(dashboardId: string, isPublic: boolean, token: string | null, expiresAt: string | null) {
    setDashboards(prev =>
      prev.map(d =>
        d.id === dashboardId
          ? { ...d, is_public: isPublic, public_token: token, public_token_expires_at: expiresAt }
          : d
      )
    )
  }

  const canShare = userRole === 'admin' || userRole === 'editor'

  if (loading) return (
    <div style={{ padding: '24px', color: '#A1A1AA', fontSize: '13px' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif' }}>

      {/* Create input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="New dashboard name..."
          style={{
            flex: 1, padding: '8px 12px',
            border: '1px solid #EAEAEA', borderRadius: '6px',
            fontSize: '13px', color: '#111111', outline: 'none',
            fontFamily: 'Inter, sans-serif'
          }}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          style={{
            padding: '8px 16px',
            background: '#111111', color: 'white',
            border: 'none', borderRadius: '6px',
            fontSize: '13px', fontWeight: 500,
            cursor: creating || !name.trim() ? 'not-allowed' : 'pointer',
            opacity: creating || !name.trim() ? 0.5 : 1,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </div>

      {/* Dashboard list */}
      {dashboards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '13px', color: '#A1A1AA' }}>
            No dashboards yet — create one above
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dashboards.map(d => (
            <div key={d.id} style={{
              padding: '12px 16px',
              border: '1px solid #EAEAEA', borderRadius: '8px',
              fontSize: '13px', fontWeight: 500, color: '#111111',
              cursor: 'pointer', background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{d.name}</span>
              {canShare && (
                <SharePopover
                  dashboardId={d.id}
                  dashboardName={d.name}
                  isPublic={d.is_public ?? false}
                  publicToken={d.public_token ?? null}
                  expiresAt={d.public_token_expires_at ?? null}
                  onUpdate={(isPublic, token, expiresAt) => handleShareUpdate(d.id, isPublic, token, expiresAt)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
