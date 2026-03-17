import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { token, sessionId, durationSeconds, deviceType } = await req.json()

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find share link by token
  const { data: link, error: findErr } = await supabase
    .from('share_links')
    .select('id, tenant_id, dashboard_slug, expires_at, view_count')
    .eq('token', token)
    .single()

  if (findErr || !link) {
    return NextResponse.json({ error: 'Link no encontrado' }, { status: 404 })
  }

  // Check expiration
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
  }

  // Insert view record and update counters in parallel
  await Promise.all([
    supabase.from('share_link_views').insert({
      share_link_id: link.id,
      session_id: sessionId ?? null,
      duration_seconds: durationSeconds ?? null,
      device_type: deviceType ?? null,
    }),
    supabase
      .from('share_links')
      .update({
        view_count: (link.view_count ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', link.id),
  ])

  return NextResponse.json({
    tenantId: link.tenant_id,
    dashboardSlug: link.dashboard_slug,
  })
}
