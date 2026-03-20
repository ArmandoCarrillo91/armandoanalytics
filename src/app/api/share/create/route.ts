import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { tenantId, dashboardSlug, type, recipientEmail, recipientName, expiresIn } = body

  if (!tenantId || !dashboardSlug || !type) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // For public links, return existing one if it exists and is not expired
  if (type === 'public') {
    const { data: existing } = await supabase
      .from('share_links')
      .select('token, view_count, created_at')
      .eq('tenant_id', tenantId)
      .eq('dashboard_slug', dashboardSlug)
      .eq('type', 'public')
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({
        token: existing.token,
        viewCount: existing.view_count,
        createdAt: existing.created_at,
      })
    }
  }

  const token = crypto.randomUUID().slice(0, 16)
  const expiresAt = expiresIn
    ? new Date(Date.now() + Number(expiresIn) * 3600000).toISOString()
    : null

  const { error } = await supabase.from('share_links').insert({
    tenant_id: tenantId,
    dashboard_slug: dashboardSlug,
    created_by: user.id,
    recipient_email: recipientEmail ?? null,
    recipient_name: recipientName ?? null,
    token,
    type,
    expires_at: expiresAt,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ token, link: `https://aa.mx/share/${token}` })
}
