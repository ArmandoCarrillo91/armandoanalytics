'use client'

const kpis = [
  { label: 'INGRESOS', value: '—' },
  { label: 'FLUJO LIBRE', value: '—' },
  { label: 'MARGEN', value: '—' },
  { label: 'SERVICIOS', value: '—' },
]

export default function KPIStrip() {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '24px 24px 0 24px' }}>
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: 3,
              marginBottom: 8,
              fontFamily: 'var(--font-jetbrains)',
            }}
          >
            {kpi.label}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'white',
              fontFamily: 'var(--font-jetbrains)',
            }}
          >
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  )
}
