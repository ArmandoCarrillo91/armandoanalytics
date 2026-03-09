'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'

const inter = Inter({ subsets: ['latin'] })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(true)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleReset() {
    if (!email) return
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email)
  }

  return (
    <div
      className={inter.className}
      style={{
        minHeight: '100vh',
        background: '#F5F5F5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '64px 48px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* LOGO ROW — centered */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 48,
            marginBottom: 48,
            textAlign: 'center',
          }}
        >
          <img
            src="/brand/logo-icon-default.svg"
            width={36}
            height={36}
            alt="ArmandoAnalytics"
          />
          <span
            className={mono.className}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#0D1117',
              letterSpacing: 2,
            }}
          >
            ARMANDOANALYTICS
          </span>
        </div>

        {/* HEADLINE */}
        <div style={{ marginTop: 'auto', paddingTop: '25vh' }}>
          <h1
            className={inter.className}
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#0D1B2E',
              letterSpacing: -1,
              margin: 0,
            }}
          >
            LOGIN
          </h1>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} style={{ marginTop: 48 }}>
          <div>
            <label
              className={mono.className}
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'rgba(0,0,0,0.35)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@armando.net"
              required
              className={mono.className}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.12)',
                padding: '10px 0',
                fontSize: 14,
                color: '#0D1117',
                outline: 'none',
                width: '100%',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderBottomColor = '#0070F3')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderBottomColor = 'rgba(0,0,0,0.12)')
              }
            />
          </div>

          <div style={{ marginTop: 32 }}>
            <label
              className={mono.className}
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'rgba(0,0,0,0.35)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="• • • • • • • • • • •"
              required
              className={mono.className}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.12)',
                padding: '10px 0',
                fontSize: 14,
                color: '#0D1117',
                outline: 'none',
                width: '100%',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderBottomColor = '#0070F3')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderBottomColor = 'rgba(0,0,0,0.12)')
              }
            />
          </div>

          {/* ERROR STATE + RESET LINK (only after failed login) */}
          {error && (
            <div style={{ marginTop: 24 }}>
              <span
                className={mono.className}
                style={{
                  fontSize: 10,
                  color: 'rgba(220,50,50,0.8)',
                  letterSpacing: 1,
                }}
              >
                ✕  CREDENCIALES INVÁLIDAS
              </span>
              <button
                type="button"
                onClick={handleReset}
                className={mono.className}
                style={{
                  marginTop: 8,
                  background: 'none',
                  border: 'none',
                  fontSize: 10,
                  color: 'rgba(0,0,0,0.25)',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  display: 'block',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                RESET ACCESS CREDENTIALS
              </button>
            </div>
          )}

          {/* CTA BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={mono.className}
            style={{
              marginTop: 40,
              width: '100%',
              background: '#0D1B2E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 4,
              height: 56,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#162744'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#0D1B2E'
            }}
          >
            {loading ? 'EXECUTING...' : 'RUN LOGIN QUERY ▸'}
          </button>
        </form>

        {/* SPACER */}
        <div style={{ flex: 1 }} />
      </div>

      <style>{`
        input::placeholder {
          color: rgba(0,0,0,0.2) !important;
        }
      `}</style>
    </div>
  )
}
