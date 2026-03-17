import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import TenantsView from './TenantsView'

export default async function TenantsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: profile }, { data: tenants }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('platform_role')
      .eq('id', user.id)
      .single(),
    supabaseAdmin
      .from('tenants')
      .select('id, slug, name, connection_type, is_active')
      .order('name'),
  ])

  if (profile?.platform_role !== 'owner') redirect('/dashboard')

  return (
    <TenantsView
      tenants={(tenants ?? []).map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        connectionType: t.connection_type ?? 'supabase',
        isActive: t.is_active,
      }))}
    />
  )
}
