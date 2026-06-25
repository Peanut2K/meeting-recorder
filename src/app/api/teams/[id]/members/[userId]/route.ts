import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase.from('team_members').select('role')
    .eq('team_id', id).eq('user_id', user.id).single()
  if (membership?.role !== 'admin')
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  // Prevent removing the last admin — check regardless of who is being removed
  const { data: admins } = await supabase.from('team_members').select('user_id')
    .eq('team_id', id).eq('role', 'admin')
  const targetMembership = await supabase.from('team_members').select('role')
    .eq('team_id', id).eq('user_id', userId).single()
  const targetIsAdmin = targetMembership.data?.role === 'admin'
  if (targetIsAdmin && (admins?.length ?? 0) <= 1)
    return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 })

  const { error } = await admin.from('team_members').delete().eq('team_id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  return NextResponse.json({ success: true })
}
