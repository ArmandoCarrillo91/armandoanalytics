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

// Get tenant_id from slug
async function getTenantId(slug: string): Promise<string> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()
  if (!data) throw new Error(`Tenant not found: ${slug}`)
  return data.id
}

// Log every action
async function logAction(
  supabase: any,
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: object
) {
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {}
  })
}

// Get all dashboards for a tenant
export async function getDashboards(tenantSlug: string) {
  const supabase = await getSupabase()
  const tenantId = await getTenantId(tenantSlug)
  const { data, error } = await supabase
    .from('dashboards')
    .select(`
      id, name, slug, description, created_at, updated_at,
      charts(count)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Get single dashboard with all charts
export async function getDashboardWithCharts(dashboardSlug: string, tenantSlug: string) {
  const supabase = await getSupabase()
  const tenantId = await getTenantId(tenantSlug)
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
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

// Create dashboard
export async function createDashboard(
  tenantSlug: string,
  userId: string,
  name: string,
  description?: string
) {
  const supabase = await getSupabase()
  const tenantId = await getTenantId(tenantSlug)
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const { data, error } = await supabase
    .from('dashboards')
    .insert({ tenant_id: tenantId, name, slug, description, created_by: userId })
    .select()
    .single()
  if (error) throw error

  await logAction(supabase, tenantId, userId, 'created', 'dashboard', data.id, { name })
  return data
}

// Create chart inside a dashboard
export async function createChart(
  dashboardId: string,
  tenantSlug: string,
  userId: string,
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
  const tenantId = await getTenantId(tenantSlug)

  const { data, error } = await supabase
    .from('charts')
    .insert({
      dashboard_id: dashboardId,
      tenant_id: tenantId,
      created_by: userId,
      ...chart,
      width: chart.width ?? 6,
      height: chart.height ?? 4
    })
    .select()
    .single()
  if (error) throw error

  await logAction(supabase, tenantId, userId, 'created', 'chart', data.id, {
    title: chart.title,
    chart_type: chart.chart_type,
    dashboard_id: dashboardId
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
  const tenantId = await getTenantId(tenantSlug)
  const { data, error } = await supabase
    .from('audit_log')
    .select('action, entity_type, metadata, created_at, user_id')
    .eq('tenant_id', tenantId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}
