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
      id, name, slug, description, created_at, updated_at,
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
