import { createClient as createAdminClient } from '@supabase/supabase-js'
import ConfigView from './ConfigView'

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>
}) {
  const params = await searchParams
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenants } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('name')

  const activeTenants = tenants ?? []
  const selectedSlug = params.tenant || activeTenants[0]?.slug || ''
  const selectedTenant = activeTenants.find((t) => t.slug === selectedSlug)

  return (
    <ConfigView
      tenants={activeTenants.map((t) => ({ slug: t.slug, name: t.name }))}
      selectedSlug={selectedSlug}
      tenantName={selectedTenant?.name ?? ''}
    />
  )
}
