import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import TallerShell from '@/components/taller/TallerShell'
import '@/components/taller/taller.css'

export default async function TallerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /* Auth check — mirrors parent layout as extra safety layer */
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* Fetch only active tenants the user belongs to + admin flag */
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: tenantRows }, { data: profile }] = await Promise.all([
    supabase
      .from('tenant_users')
      .select('role, tenant:tenants!inner(slug, name)')
      .eq('user_id', user.id)
      .eq('tenant.is_active', true),
    supabaseAdmin
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single(),
  ])

  const rows = tenantRows ?? []
  const otherTenants = rows
    .map((r: any) => ({ slug: r.tenant.slug as string, name: r.tenant.name as string }))
    .filter((t) => t.slug !== 'taller')

  const isPlatformAdmin = profile?.is_platform_admin === true
  const tallerRow = rows.find((r: any) => r.tenant.slug === 'taller') as any
  const userRole: string | null = tallerRow?.role ?? null

  return (
    <>
      {/* Google Fonts for Taller section */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <TallerShell otherTenants={otherTenants} isPlatformAdmin={isPlatformAdmin} userRole={userRole}>{children}</TallerShell>
    </>
  )
}
