'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

const inter = Inter({ subsets: ['latin'] })

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
      {/* ─── LEFT PANEL ─── */}
      <div className={styles.left}>
        <div className={styles.leftLogo}>
          <img src="/brand/logo-icon-default.svg" width={40} height={40} alt="" />
          <span className={styles.leftLogoText}>ARMANDOANALYTICS</span>
        </div>

        <div className={styles.watermark}>A</div>

        <div className={styles.leftFooter}>
          <span className={styles.statusLine}>SYSTEM.STATUS: OPERATIONAL</span>
          <span className={styles.statusLine}>DATA.STREAM: ENCRYPTED</span>
          <span className={styles.statusLine}>NODE.ALPHA: CONNECTED</span>
          <span className={styles.copyright}>© 2024 ARMANDO ANALYTICS SYSTEMS V4.0.2</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className={styles.right}>
        <div className={styles.formWrapper}>
          <div className={styles.rightLogo}>
            <img src="/brand/logo-icon-default.svg" width={36} height={36} alt="" />
            <span className={styles.rightLogoText}>ARMANDOANALYTICS</span>
          </div>

          <h1 className={styles.headline}>ACCESS SYSTEM</h1>
          <div className={styles.underline} />

          <form onSubmit={handleLogin}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>EMAIL ADDRESS</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="USER@DOMAIN.SYS"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>SECURE KEY</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="• • • • • • • • • • •"
                required
              />
            </div>

            {error && (
              <p className={styles.errorMsg}>Invalid credentials. Try again.</p>
            )}

            <button
              className={styles.button}
              type="submit"
              disabled={loading}
            >
              {loading ? 'EXECUTING...' : 'EXECUTE →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
