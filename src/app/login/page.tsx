'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JetBrains_Mono } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

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
      className={mono.className}
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
        {/* TOP-LEFT LOGO ROW */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/brand/logo-icon-default.svg"
            width={36}
            height={36}
            alt="ArmandoAnalytics"
          />
          <span
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
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#0D1117',
              letterSpacing: -1,
              margin: 0,
            }}
          >
            EXECUTE LOGIN
          </h1>
          <p
            style={{
              fontSize: 11,
              color: 'rgba(0,0,0,0.3)',
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginTop: 8,
              margin: '8px 0 0 0',
            }}
          >
            ACCESSING TERMINAL INTERFACE V2.04.1
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} style={{ marginTop: 48 }}>
          <div>
            <label
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
              01 / USER_EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@armando.net"
              required
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.12)',
                padding: '10px 0',
                fontFamily: 'inherit',
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
              02 / ACCESS_KEY
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="• • • • • • • • • • •"
              required
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.12)',
                padding: '10px 0',
                fontFamily: 'inherit',
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

          {/* ERROR STATE */}
          {error && (
            <div
              style={{
                marginTop: 24,
                fontSize: 10,
                color: 'rgba(220,50,50,0.8)',
                letterSpacing: 1,
                fontFamily: 'inherit',
              }}
            >
              ✕  CREDENCIALES INVÁLIDAS
            </div>
          )}

          {/* CTA BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 40,
              width: '100%',
              background: loading ? '#0D1117' : '#0D1117',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 4,
              height: 56,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#0070F3'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#0D1117'
            }}
          >
            {loading ? 'EXECUTING...' : 'RUN LOGIN QUERY ▸'}
          </button>
        </form>

        {/* RESET LINK */}
        <button
          onClick={handleReset}
          style={{
            marginTop: 20,
            background: 'none',
            border: 'none',
            fontSize: 10,
            color: 'rgba(0,0,0,0.25)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            textAlign: 'center',
            display: 'block',
            width: '100%',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          RESET ACCESS CREDENTIALS
        </button>

        {/* SPACER */}
        <div style={{ flex: 1 }} />
      </div>

      {/* FOOTER — fixed bottom left */}
      <div
        style={{
          position: 'fixed',
          bottom: 32,
          left: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            background: '#22C55E',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: 'rgba(0,0,0,0.2)',
            letterSpacing: 1,
            fontFamily: 'inherit',
          }}
        >
          SYSTEM ACTIVE · V2.0.412-STABLE · NODE_01
        </span>
      </div>

      {/* PULSE ANIMATION */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        input::placeholder {
          color: rgba(0,0,0,0.2) !important;
        }
      `}</style>
    </div>
  )
}
