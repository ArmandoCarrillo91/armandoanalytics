import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // Verify caller is authenticated
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Use service role to bypass RLS when checking is_platform_admin
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) {
    return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 })
  }

  const { email, password, tenant_id, role } = await request.json()

  if (!email || !password || !tenant_id) {
    return NextResponse.json({ error: 'Email, contraseña y tenant son requeridos' }, { status: 400 })
  }

  const validRoles = ['admin', 'editor', 'viewer']
  const safeRole = validRoles.includes(role) ? role : 'viewer'

  // Step 1: Create user in Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: `Error creando usuario auth: ${authError.message}` }, { status: 400 })
  }

  const newUserId = authData.user.id

  // Step 2: Insert into users table
  const { error: usersError } = await admin
    .from('users')
    .insert({ id: newUserId, email, full_name: '', is_platform_admin: false })

  if (usersError) {
    return NextResponse.json({ error: `Error insertando en users: ${usersError.message}` }, { status: 400 })
  }

  // Step 3: Insert into tenant_users table
  const { error: tenantError } = await admin
    .from('tenant_users')
    .insert({ tenant_id, user_id: newUserId, role: safeRole })

  if (tenantError) {
    return NextResponse.json({ error: `Error insertando en tenant_users: ${tenantError.message}` }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
