'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

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
    <div className={`${inter.className} ${styles.root}`}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img
            className={styles.logoIcon}
            src="/brand/logo-icon-default.svg"
            width={40}
            height={40}
            alt=""
          />
          <span className={styles.logoText}>ARMANDOANALYTICS</span>
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
