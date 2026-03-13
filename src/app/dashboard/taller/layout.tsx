import { createClient } from '@/lib/supabase/server'
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

  /* Fetch only active tenants the user belongs to, exclude current ('taller') */
  const { data: tenantRows } = await supabase
    .from('tenant_users')
    .select('tenant:tenants!inner(slug, name)')
    .eq('user_id', user.id)
    .eq('tenant.is_active', true)

  const otherTenants = (tenantRows ?? [])
    .map((r: any) => ({ slug: r.tenant.slug as string, name: r.tenant.name as string }))
    .filter((t) => t.slug !== 'taller')

  return (
    <>
      {/* Google Fonts for Taller section */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <TallerShell otherTenants={otherTenants}>{children}</TallerShell>
    </>
  )
}
