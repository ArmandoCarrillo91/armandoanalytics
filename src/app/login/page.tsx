'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

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

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <svg className={styles.logoSvg} width="52" height="52" viewBox="0 0 52 52" fill="none">
            <rect x=".5" y=".5" width="51" height="51" rx="13"
              stroke="rgba(255,255,255,0.08)" fill="rgba(255,255,255,0.03)" />
            <text x="26" y="26" textAnchor="middle" dominantBaseline="central"
              fontSize="30" fontWeight="800" fill="rgba(255,255,255,0.95)"
              fontFamily="Inter, sans-serif">A</text>
          </svg>
          <span className={styles.logoText}>armandoanalytics</span>
        </div>

        <form onSubmit={handleLogin}>
          <div className={styles.fieldEmail}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              required
            />
          </div>

          <div>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className={styles.error}>Invalid credentials. Please try again.</p>
          )}

          <button
            className={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footer}>
          Internal system · Access by invitation only.
        </p>
      </div>
    </div>
  )
}
