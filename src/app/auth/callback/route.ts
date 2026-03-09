import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          }
        }
      }
    )
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(slug)')
        .eq('user_id', session.user.id)
        .single()

      const slug = (tenantUser?.tenants as any)?.slug ?? 'taller'
      return NextResponse.redirect(`${origin}/dashboard/${slug}`)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard/taller`)
}
