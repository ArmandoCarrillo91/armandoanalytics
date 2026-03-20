import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import UsuariosView from './UsuariosView'

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: profile }, { data: tenants }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('platform_role')
      .eq('id', user!.id)
      .single(),
    supabaseAdmin
      .from('tenants')
      .select('id, slug, name')
      .eq('is_active', true)
      .order('name'),
  ])

  const platformRole = (profile?.platform_role as string) ?? 'none'
  const activeTenants = tenants ?? []
  const selectedSlug = params.tenant || activeTenants[0]?.slug || ''
  const selectedTenant = activeTenants.find((t) => t.slug === selectedSlug)

  let users: { id: string; email: string; full_name: string | null; platform_role: string; role: string }[] = []

  if (selectedTenant) {
    const { data: tenantUsers } = await supabaseAdmin
      .from('tenant_users')
      .select('role, user:users!inner(id, email, full_name, platform_role)')
      .eq('tenant_id', selectedTenant.id)

    users = (tenantUsers ?? []).map((tu: any) => ({
      id: tu.user.id,
      email: tu.user.email,
      full_name: tu.user.full_name,
      platform_role: tu.user.platform_role ?? 'none',
      role: tu.role,
    }))
  }

  return (
    <UsuariosView
      tenants={activeTenants.map((t) => ({ slug: t.slug, name: t.name, id: t.id }))}
      selectedSlug={selectedSlug}
      selectedTenantId={selectedTenant?.id ?? ''}
      users={users}
      platformRole={platformRole}
    />
  )
}
