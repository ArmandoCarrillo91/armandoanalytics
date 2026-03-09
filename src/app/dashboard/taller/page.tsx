import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TallerDashboard from '@/components/taller/TallerDashboard'

export default async function TallerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <TallerDashboard user={{ email: user.email ?? '' }} />
}
