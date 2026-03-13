'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )
}

// Get all dashboards for a tenant
export async function getDashboards(tenantSlug: string) {
  const supabase = await getSupabase()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  if (!tenant) throw new Error(`Tenant not found: ${tenantSlug}`)

  const { data, error } = await supabase
    .from('dashboards')
    .select(`
      id, name, slug, description, is_public, public_token, public_token_expires_at, created_at, updated_at,
      charts(count)
    `)
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Get single dashboard with all charts by slug
export async function getDashboardWithCharts(dashboardSlug: string, tenantSlug: string) {
  const supabase = await getSupabase()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  if (!tenant) throw new Error(`Tenant not found: ${tenantSlug}`)

  const { data, error } = await supabase
    .from('dashboards')
    .select(`
      id, name, slug, description, layout_config,
      charts(
        id, title, subtitle, chart_type,
        query_config, display_config,
        position_x, position_y, width, height,
        created_at, updated_at
      )
    `)
    .eq('slug', dashboardSlug)
    .eq('tenant_id', tenant.id)
    .single()
  if (error) throw error
  return data
}

// Get single dashboard with all charts by ID
export async function getDashboardWithChartsById(dashboardId: string, tenantSlug: string) {
  const supabase = await getSupabase()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  if (!tenant) throw new Error(`Tenant not found: ${tenantSlug}`)

  const { data, error } = await supabase
    .from('dashboards')
    .select(`
      id, name, slug, description, layout_config,
      charts(
        id, title, subtitle, chart_type,
        query_config, display_config,
        position_x, position_y, width, height,
        created_at, updated_at
      )
    `)
    .eq('id', dashboardId)
    .eq('tenant_id', tenant.id)
    .single()
  if (error) throw error
  return data
}

// Create dashboard — gets userId from auth session
export async function createDashboard(tenantSlug: string, name: string) {
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  if (!tenant) throw new Error(`Tenant not found: ${tenantSlug}`)

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const { data, error } = await supabase
    .from('dashboards')
    .insert({
      tenant_id: tenant.id,
      name,
      slug,
      created_by: user.id
    })
    .select()
    .single()
  if (error) throw error

  await supabase.from('audit_log').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    action: 'created',
    entity_type: 'dashboard',
    entity_id: data.id,
    metadata: { name }
  })

  return data
}

// Create chart — gets userId from auth session
export async function createChart(
  dashboardId: string,
  tenantSlug: string,
  chart: {
    title: string
    subtitle?: string
    chart_type: 'line' | 'bar' | 'pie' | 'kpi' | 'table'
    query_config: object
    display_config: object
    position_x?: number
    position_y?: number
    width?: number
    height?: number
  }
) {
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  if (!tenant) throw new Error(`Tenant not found: ${tenantSlug}`)

  const { data, error } = await supabase
    .from('charts')
    .insert({
      dashboard_id: dashboardId,
      tenant_id: tenant.id,
      created_by: user.id,
      ...chart,
      width: chart.width ?? 6,
      height: chart.height ?? 4
    })
    .select()
    .single()
  if (error) throw error

  await supabase.from('audit_log').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    action: 'created',
    entity_type: 'chart',
    entity_id: data.id,
    metadata: {
      title: chart.title,
      chart_type: chart.chart_type,
      dashboard_id: dashboardId
    }
  })

  return data
}

// Get current user's role for a tenant
export async function getUserTenantRole(tenantSlug: string): Promise<string | null> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('tenant_users')
    .select('role, tenant:tenants!inner(slug)')
    .eq('user_id', user.id)
    .eq('tenant.slug', tenantSlug)
    .single()

  return data?.role ?? null
}

// Toggle public share link for a dashboard
export async function toggleDashboardShare(
  dashboardId: string,
  action: 'enable' | 'disable' | 'renew'
): Promise<{ is_public: boolean; public_token: string | null; public_token_expires_at: string | null }> {
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get dashboard to find tenant_id
  const { data: dashboard } = await supabase
    .from('dashboards')
    .select('id, tenant_id, public_token')
    .eq('id', dashboardId)
    .single()
  if (!dashboard) throw new Error('Dashboard not found')

  // Check user has admin or editor role
  const { data: membership } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', dashboard.tenant_id)
    .single()
  if (!membership || membership.role === 'viewer') {
    throw new Error('Insufficient permissions')
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  if (action === 'enable') {
    const token = dashboard.public_token ?? crypto.randomUUID()
    const { error } = await supabase
      .from('dashboards')
      .update({ is_public: true, public_token: token, public_token_expires_at: expiresAt })
      .eq('id', dashboardId)
    if (error) throw error
    return { is_public: true, public_token: token, public_token_expires_at: expiresAt }
  } else if (action === 'renew') {
    const { error } = await supabase
      .from('dashboards')
      .update({ public_token_expires_at: expiresAt })
      .eq('id', dashboardId)
    if (error) throw error
    return { is_public: true, public_token: dashboard.public_token, public_token_expires_at: expiresAt }
  } else {
    const { error } = await supabase
      .from('dashboards')
      .update({ is_public: false })
      .eq('id', dashboardId)
    if (error) throw error
    return { is_public: false, public_token: dashboard.public_token, public_token_expires_at: null }
  }
}

// Get current share state for a dashboard
export async function getDashboardShareState(dashboardId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('dashboards')
    .select('is_public, public_token, public_token_expires_at')
    .eq('id', dashboardId)
    .single()
  if (error) throw error
  return data as { is_public: boolean; public_token: string | null; public_token_expires_at: string | null }
}

// Get audit history for a dashboard or chart
export async function getAuditLog(
  tenantSlug: string,
  entityType: 'dashboard' | 'chart',
  entityId: string
) {
  const supabase = await getSupabase()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()
  if (!tenant) throw new Error(`Tenant not found: ${tenantSlug}`)

  const { data, error } = await supabase
    .from('audit_log')
    .select('action, entity_type, metadata, created_at, user_id')
    .eq('tenant_id', tenant.id)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}
