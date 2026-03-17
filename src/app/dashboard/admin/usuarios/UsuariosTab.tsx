'use client'

import { useState } from 'react'

interface User { id: string; email: string; full_name: string | null; platform_role: string; role: string }

const rolePill = (role: string) => {
  const isAdmin = role === 'admin'
  return {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 99,
    background: isAdmin ? '#EEEDFE' : '#F1EFE8',
    color: isAdmin ? '#3C3489' : '#444441',
  } as const
}

export default function UsuariosTab({ users, platformRole }: { users: User[]; platformRole: string }) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const isOwner = platformRole === 'owner'

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '12px 14px', flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total usuarios</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-black)' }}>{users.length}</div>
        </div>
        <div style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '12px 14px', flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Visitas este mes</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-black)' }}>0</div>
        </div>
      </div>

      {/* Users table */}
      <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover)' }}>
              <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 500, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuario</th>
              <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 500, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Rol</th>
              <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 500, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Visitas</th>
              {isOwner && <th style={{ width: 48, padding: '8px 16px' }} />}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const initials = (u.full_name || u.email).slice(0, 2).toUpperCase()
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: 'var(--text-black)',
                        color: 'var(--bg-light)', fontSize: 10, fontWeight: 500,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-black)' }}>{u.full_name || u.email.split('@')[0]}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}><span style={rolePill(u.role)}>{u.role}</span></td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: 'var(--text-gray)' }}>0</td>
                  {isOwner && (
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>···</td>
                  )}
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr><td colSpan={isOwner ? 4 : 3} style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite form (owner only) */}
      {isOwner && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          borderTop: '1px solid var(--border-light)',
          background: 'var(--bg-hover)', padding: '12px 16px',
          borderRadius: 8,
        }}>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{
              flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 8,
              border: '1px solid var(--border-light)', background: 'var(--bg-light)', color: 'var(--text-black)',
            }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            style={{
              padding: '8px 10px', fontSize: 13, borderRadius: 8,
              border: '1px solid var(--border-light)', background: 'var(--bg-light)', color: 'var(--text-black)',
            }}
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => { console.log('invite', inviteEmail, inviteRole); setInviteEmail('') }}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 8,
              border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
            }}
          >
            Invitar
          </button>
        </div>
      )}
    </div>
  )
}
