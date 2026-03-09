'use client'

import { JetBrains_Mono } from 'next/font/google'
import Image from 'next/image'
import KPIStrip from './KPIStrip'
import FlujoDiarioChart from './FlujoDiarioChart'
import GastosCategoriaChart from './GastosCategoriaChart'

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
})

interface Props {
  user: { email: string }
}

export default function TallerDashboard({ user }: Props) {
  return (
    <div
      className={jetbrains.variable}
      style={{
        background: '#0D1117',
        minHeight: '100vh',
        fontFamily: 'var(--font-jetbrains)',
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image
            src="/brand/logo-icon-navbar.svg"
            alt="Logo"
            width={28}
            height={28}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
            TALLER MECÁNICO RAFA
          </span>
          <span
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              padding: '2px 8px',
            }}
          >
            TENANT_01
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          {user.email}
        </span>
      </div>

      {/* KPI STRIP */}
      <KPIStrip />

      {/* CHARTS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '65fr 35fr',
          gap: 16,
          padding: 24,
        }}
      >
        <FlujoDiarioChart />
        <GastosCategoriaChart />
      </div>
    </div>
  )
}
