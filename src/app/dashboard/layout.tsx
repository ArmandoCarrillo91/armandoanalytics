import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch only active tenants the user belongs to + admin flag
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: tenantRows }, { data: profile }] = await Promise.all([
    supabase
      .from('tenant_users')
      .select('tenant:tenants!inner(slug, name)')
      .eq('user_id', user.id)
      .eq('tenant.is_active', true),
    supabaseAdmin
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single(),
  ])

  const tenants = (tenantRows ?? []).map((r: any) => ({
    slug: r.tenant.slug as string,
    name: r.tenant.name as string,
  }))

  const isPlatformAdmin = profile?.is_platform_admin === true

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-light)' }}>
      <Sidebar tenants={tenants} email={user.email ?? ''} isPlatformAdmin={isPlatformAdmin} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <main
          className="dot-grid"
          style={{
            flex: 1,
            background: 'var(--bg-canvas)',
            padding: 24,
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
