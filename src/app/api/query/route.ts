import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantClientCached } from '@/lib/tenant-client'


export async function POST(req: NextRequest) {
  const { sql, tenantSlug } = await req.json()

  if (!sql || !tenantSlug) {
    return NextResponse.json({ error: 'Missing sql or tenantSlug' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const aa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )

  // 1. Verificar que hay sesión activa
  const { data: { user }, error: authError } = await aa.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Verificar que el usuario pertenece al tenant que está solicitando
  const { data: membership } = await aa
    .from('tenant_users')
    .select('role, tenant:tenants!inner(id, slug, db_url, db_anon_key, is_active)')
    .eq('user_id', user.id)
    .eq('tenant.slug', tenantSlug)
    .eq('tenant.is_active', true)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenant = membership.tenant as any

  if (!tenant?.db_url || !tenant?.db_anon_key) {
    return NextResponse.json({ error: 'Tenant not configured' }, { status: 400 })
  }

  // 3. Ejecutar SQL contra la BD del tenant
  const tenantDb = getTenantClientCached(tenantSlug, tenant.db_url, tenant.db_anon_key)
  const { data, error } = await tenantDb.rpc('execute_query', { query: sql })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}