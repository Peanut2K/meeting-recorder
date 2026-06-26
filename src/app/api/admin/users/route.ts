import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGlobalAdmin } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

// GET — list all users (global admin only)
export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { data, error } = await admin
    .from('users').select('id, email, name, role, created_at')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create a new user (global admin only)
export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: { email?: string; password?: string; name?: string; role?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { email, password, name, role = 'user' } = body
  if (!email || !password || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (role !== 'admin' && role !== 'user')
    return NextResponse.json({ error: 'role must be admin or user' }, { status: 400 })

  // Create the auth user with the service-role client (email pre-confirmed).
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (authError || !created.user)
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })

  // Create the matching public.users profile row.
  const { error: profileError } = await admin
    .from('users').insert({ id: created.user.id, email, name, role })
  if (profileError) {
    // Roll back the orphaned auth user.
    await admin.auth.admin.deleteUser(created.user.id)
    if (profileError.code === '23505')
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ id: created.user.id, email, name, role }, { status: 201 })
}
