import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGlobalAdmin } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

// PATCH — change a user's global role (global admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: { role?: string; password?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  // Set a new password (admins can reset, not view — passwords are hashed and unreadable).
  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    const { error } = await admin.auth.admin.updateUserById(userId, { password: body.password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.role !== undefined) {
    if (body.role !== 'admin' && body.role !== 'user')
      return NextResponse.json({ error: 'role must be admin or user' }, { status: 400 })

    // Don't let the last admin demote themselves out of the system.
    if (userId === user.id && body.role === 'user') {
      const { data: admins } = await admin.from('users').select('id').eq('role', 'admin')
      if ((admins?.length ?? 0) <= 1)
        return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 })
    }

    const { error } = await admin.from('users').update({ role: body.role }).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.password === undefined && body.role === undefined)
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  return NextResponse.json({ success: true })
}

// DELETE — remove a user entirely (global admin only)
export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  if (userId === user.id)
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

  // Deleting the auth user cascades to public.users (FK on delete cascade)
  // and team_members.
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
