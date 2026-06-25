import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let body: { email?: string; password?: string; name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password, name } = body
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // signUp may return existing user without error on duplicate email
  if (!data.user) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 400 })
  }

  const { error: profileError } = await supabase
    .from('users')
    .insert({ id: data.user.id, email, name })

  if (profileError) {
    // Clean up the orphaned auth user before returning the error
    await admin.auth.admin.deleteUser(data.user.id)
    // Return a generic message — don't leak Postgres error details (e.g. constraint names)
    if (profileError.code === '23505') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
