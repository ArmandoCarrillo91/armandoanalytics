import { createAdminClient } from '@/lib/supabase/admin'
import PublicDashboard from './PublicDashboard'
import PulsoPublic from './PulsoPublic'
import ShareDurationTracker from './ShareDurationTracker'
import { getClasesAnioPublic } from '@/tenants/energy/dashboards/summary/queriesPublic'
import ClasesAnio from '@/tenants/energy/dashboards/summary/charts/clases-anio/ClasesAnio'

const SENSITIVE_WORDS = ['nómina', 'nomina', 'cuentas', 'salario', 'sueldo', 'payroll']

const centered: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--bg-canvas)',
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()

  // 1) Try new share_links table first
  const { data: shareLink } = await supabase
    .from('share_links')
    .select('id, tenant_id, dashboard_slug, expires_at, view_count')
    .eq('token', token)
    .single()

  if (shareLink) {
    return renderShareLink(shareLink, token, supabase)
  }

  // 2) Fall back to legacy Taller dashboards.public_token
  return renderLegacyShare(token, supabase)
}

/* ── New share_links system (Energy) ── */
async function renderShareLink(
  link: { id: string; tenant_id: string; dashboard_slug: string; expires_at: string | null; view_count: number },
  token: string,
  supabase: ReturnType<typeof createAdminClient>
) {
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return <div style={centered}>
      <p style={{ fontSize: 16, color: 'var(--text-gray)', fontWeight: 500 }}>
        Este enlace ha expirado.
      </p>
    </div>
  }

  // Increment view
  await supabase
    .from('share_links')
    .update({ view_count: (link.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq('id', link.id)

  // Get tenant name
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', link.tenant_id)
    .single()

  const tenantName = tenant?.name ?? 'Dashboard'

  // Render energy summary dashboard
  if (link.dashboard_slug === 'summary') {
    const clasesData = await getClasesAnioPublic()
    return (
      <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh', padding: '2rem' }}>
        <ClasesAnio data={clasesData} />
        <ShareDurationTracker token={token} />
        <Watermark tenantName={tenantName} />
      </div>
    )
  }

  return <div style={centered}>
    <p style={{ fontSize: 16, color: 'var(--text-gray)', fontWeight: 500 }}>
      Dashboard no disponible.
    </p>
  </div>
}

/* ── Legacy Taller dashboards ── */
async function renderLegacyShare(
  token: string,
  supabase: ReturnType<typeof createAdminClient>
) {
  const { data: dashboard } = await supabase
    .from('dashboards')
    .select(`
      id, name, slug, description, public_token_expires_at,
      charts(id, title, subtitle, chart_type, display_config,
             position_x, position_y, width, height)
    `)
    .eq('public_token', token)
    .eq('is_public', true)
    .single()

  if (!dashboard) {
    return <div style={centered}>
      <p style={{ fontSize: 16, color: 'var(--text-gray)', fontWeight: 500 }}>
        Este enlace no es válido o ha sido desactivado
      </p>
    </div>
  }

  if (dashboard.public_token_expires_at && new Date(dashboard.public_token_expires_at) < new Date()) {
    return <div style={centered}>
      <p style={{ fontSize: 16, color: 'var(--text-gray)', fontWeight: 500 }}>
        Este enlace ha expirado. Solicita uno nuevo al administrador.
      </p>
    </div>
  }

  if (dashboard.slug === 'pulso') {
    return (
      <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
        <PulsoPublic />
        <Watermark tenantName="Taller" />
      </div>
    )
  }

  const filtered = (dashboard.charts || []).filter((c: any) => {
    const t = c.title.toLowerCase()
    return !SENSITIVE_WORDS.some((w) => t.includes(w))
  })

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      <PublicDashboard dashboard={{ ...dashboard, charts: filtered }} />
      <Watermark tenantName="Taller" />
    </div>
  )
}

function Watermark({ tenantName }: { tenantName: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0 24px', fontFamily: 'Inter, sans-serif' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Vista compartida · {tenantName}
      </span>
    </div>
  )
}
