'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JetBrains_Mono } from 'next/font/google'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
})

const metrics = [
  { id: 'A1', label: 'MONTHLY REVENUE', barClass: styles.metricBarBlue },
  { id: 'B1', label: 'FREE CASH FLOW', barClass: styles.metricBarGreen },
  { id: 'A2', label: 'MARGIN %', barClass: styles.metricBarAmber },
  { id: 'B2', label: 'SERVICES DELTA', barClass: styles.metricBarGray },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('CREDENCIALES INVÁLIDAS — INTENTA DE NUEVO')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className={`${jetbrains.variable} ${styles.container}`}>
      {/* LEFT PANEL */}
      <div className={styles.leftPanel}>
        <div className={styles.systemNode}>
          SYSTEM_NODE: 0X4492 // LAT: 40.7128 N
        </div>

        <div className={styles.metricsGrid}>
          {metrics.map((m) => (
            <div key={m.id} className={styles.metricCard}>
              <div className={styles.metricLabel}>
                {m.id} // {m.label}
              </div>
              <div className={styles.metricBarContainer}>
                <div className={m.barClass} />
              </div>
              <span className={styles.lockIcon}>&#128274;</span>
              <div className={styles.signInPrompt}>SIGN IN TO VIEW</div>
            </div>
          ))}
        </div>

        <div className={styles.encryption}>
          ENCRYPTION: AES-256-GCM
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.rightPanel}>
        <div className={styles.brand}>
          <Image
            src="/brand/logo-icon-default.svg"
            alt="ArmandoAnalytics"
            width={32}
            height={32}
          />
          <span className={styles.brandName}>ARMANDOANALYTICS</span>
        </div>

        <h1 className={styles.headline}>EXECUTE LOGIN</h1>
        <p className={styles.subtext}>
          ACCESSING TERMINAL INTERFACE V2.04.1
        </p>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.field}>
            <label className={styles.label}>01 / USER_EMAIL</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@domain.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>02 / ACCESS_KEY</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button
            className={styles.submitButton}
            type="submit"
            disabled={loading}
          >
            {loading ? 'EXECUTING...' : 'RUN LOGIN QUERY ▸'}
          </button>
        </form>

        <button className={styles.resetLink}>
          RESET ACCESS CREDENTIALS
        </button>

        <div className={styles.footer}>
          <div className={styles.greenDot} />
          <span className={styles.footerText}>
            SYSTEM ACTIVE · V2.0.412-STABLE · NODE_01
          </span>
        </div>
      </div>
    </div>
  )
}
