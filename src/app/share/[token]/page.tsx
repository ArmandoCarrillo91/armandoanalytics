import { createAdminClient } from '@/lib/supabase/admin'
import PublicDashboard from './PublicDashboard'

const SENSITIVE_WORDS = ['nómina', 'nomina', 'cuentas', 'salario', 'sueldo', 'payroll']

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: dashboard } = await supabase
    .from('dashboards')
    .select(`
      id, name, description, public_token_expires_at,
      charts(
        id, title, subtitle, chart_type,
        display_config,
        position_x, position_y, width, height
      )
    `)
    .eq('public_token', token)
    .eq('is_public', true)
    .single()

  if (!dashboard) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
          background: 'var(--bg-canvas)',
        }}
      >
        <p style={{ fontSize: '16px', color: 'var(--text-gray)', fontWeight: 500 }}>
          Este enlace no es v&aacute;lido o ha sido desactivado
        </p>
      </div>
    )
  }

  // Check expiration
  if (
    dashboard.public_token_expires_at &&
    new Date(dashboard.public_token_expires_at) < new Date()
  ) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
          background: 'var(--bg-canvas)',
        }}
      >
        <p style={{ fontSize: '16px', color: 'var(--text-gray)', fontWeight: 500 }}>
          Este enlace ha expirado. Solicita uno nuevo al administrador.
        </p>
      </div>
    )
  }

  // Filter out sensitive charts
  const filteredCharts = (dashboard.charts || []).filter((chart) => {
    const title = chart.title.toLowerCase()
    return !SENSITIVE_WORDS.some((word) => title.includes(word))
  })

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      <PublicDashboard
        dashboard={{ ...dashboard, charts: filteredCharts }}
      />

      {/* Watermark */}
      <div
        style={{
          textAlign: 'center',
          padding: '32px 0 24px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.5px',
          }}
        >
          AA
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginLeft: '6px',
          }}
        >
          Shared by ArmandoAnalytics
        </span>
      </div>
    </div>
  )
}
