import { createClient } from '@/lib/supabase/server'
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

  // Fetch tenant list for sidebar nav
  const { data: tenantRows } = await supabase
    .from('tenant_users')
    .select('tenant:tenants(slug, name)')
    .eq('user_id', user.id)

  const tenants = (tenantRows ?? []).map((r: any) => ({
    slug: r.tenant.slug as string,
    name: r.tenant.name as string,
  }))

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-light)' }}>
      <Sidebar tenants={tenants} email={user.email ?? ''} />
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
