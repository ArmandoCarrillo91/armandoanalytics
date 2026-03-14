import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardIndex() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant:tenants(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const slug = (tenantUser?.tenant as any)?.slug
  if (slug) {
    redirect(`/dashboard/${slug}`)
  }

  console.error('dashboard/page: could not resolve tenant for user', user.id)
  redirect('/')
}
