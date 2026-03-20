import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EnergyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenantRows } = await supabase
    .from('tenant_users')
    .select('role, tenant:tenants!inner(slug)')
    .eq('user_id', user.id)
    .eq('tenant.slug', 'energy')
    .eq('tenant.is_active', true)

  if (!tenantRows || tenantRows.length === 0) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
