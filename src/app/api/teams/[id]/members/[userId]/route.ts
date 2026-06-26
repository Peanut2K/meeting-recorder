import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGlobalAdmin } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

// PATCH — change a member's team role (head | member); global admin only
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: { role?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  if (body.role !== 'head' && body.role !== 'member')
    return NextResponse.json({ error: 'role must be head or member' }, { status: 400 })

  // Demoting a head: ensure the team keeps at least one head.
  if (body.role === 'member') {
    const { data: heads } = await admin.from('team_members').select('user_id')
      .eq('team_id', id).eq('role', 'head')
    const isLastHead = heads?.length === 1 && heads[0].user_id === userId
    if (isLastHead)
      return NextResponse.json({ error: 'Cannot demote the last head' }, { status: 400 })
  }

  const { error } = await admin.from('team_members')
    .update({ role: body.role }).eq('team_id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  // Prevent removing the last head — a team must keep at least one head.
  const { data: heads } = await admin.from('team_members').select('user_id')
    .eq('team_id', id).eq('role', 'head')
  const targetMembership = await admin.from('team_members').select('role')
    .eq('team_id', id).eq('user_id', userId).single()
  const targetIsHead = targetMembership.data?.role === 'head'
  if (targetIsHead && (heads?.length ?? 0) <= 1)
    return NextResponse.json({ error: 'Cannot remove the last head' }, { status: 400 })

  const { error } = await admin.from('team_members').delete().eq('team_id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  return NextResponse.json({ success: true })
}
