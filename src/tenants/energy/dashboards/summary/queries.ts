import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function getTenantClient() {
  const cookieStore = cookies()
  const { createServerClient } = await import('@supabase/ssr')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: tenant } = await supabase
    .from('tenants')
    .select('db_url, db_anon_key')
    .eq('slug', 'energy')
    .single()

  if (!tenant?.db_url || !tenant?.db_anon_key) {
    throw new Error('Tenant "energy" not found')
  }

  return createClient(tenant.db_url, tenant.db_anon_key)
}

export async function getClasesAnio() {
  const client = await getTenantClient()
  const { data, error } = await client.rpc('execute_query', { query: `
    SELECT
      DATE_TRUNC('month', class_date) AS periodo,
      COUNT(*) AS clases_reservadas
    FROM energy.class_reservations
    WHERE EXTRACT(YEAR FROM class_date) = EXTRACT(YEAR FROM NOW())
      AND (is_refunded = false OR is_refunded IS NULL)
    GROUP BY periodo
    ORDER BY periodo
  `})

  console.log('Energy getClasesAnio data:', data)
  console.log('Energy getClasesAnio error:', error)

  return data ?? []
}
