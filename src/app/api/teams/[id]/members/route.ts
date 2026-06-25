import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase.from('team_members').select('role')
    .eq('team_id', id).eq('user_id', user.id).single()
  if (membership?.role !== 'admin')
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: { email?: string; role?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { email, role = 'member' } = body
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Use admin client to look up user by email (bypasses RLS on users table)
  const { data: targetUser } = await admin.from('users').select('id').eq('email', email).single()
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error } = await admin.from('team_members')
    .upsert({ team_id: id, user_id: targetUser.id, role })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
