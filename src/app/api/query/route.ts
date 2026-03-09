import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { sql, tenantSlug } = await req.json()

  if (!sql || !tenantSlug) {
    return NextResponse.json({ error: 'Missing sql or tenantSlug' }, { status: 400 })
  }

  // Get tenant credentials from ArmandoAnalytics DB
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

  const { data: tenant } = await aa
    .from('tenants')
    .select('db_url, db_anon_key')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant?.db_url || !tenant?.db_anon_key) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  // Execute SQL against tenant DB using rpc
  const tenantDb = createClient(tenant.db_url, tenant.db_anon_key)
  const { data, error } = await tenantDb.rpc('execute_query', { query: sql })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}
