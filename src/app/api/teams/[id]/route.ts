import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGlobalAdmin, canManageTeam } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('teams').select('*, team_members(user_id, role, users(id, name, email))')
    .eq('id', id).single()
  if (error) {
    // PGRST116 = row not found; other errors are server errors
    const status = error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await canManageTeam(supabase, admin, id, user.id)))
    return NextResponse.json({ error: 'Only the team head can delete the team' }, { status: 403 })

  // Remove all meeting audio files from storage before deleting the team
  const { data: meetings } = await admin.from('meetings').select('id').eq('team_id', id)
  if (meetings?.length) {
    const paths = meetings.flatMap(m => [`${id}/${m.id}.mp3`, `${id}/${m.id}.webm`])
    await admin.storage.from('meeting-audio').remove(paths).catch(() => {})
  }

  const { error } = await admin.from('teams').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: { name?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  // Use admin client: teams has no UPDATE RLS policy, so a user-client update is
  // blocked (0 rows -> .single() errors). Already gated by isGlobalAdmin above.
  const { data, error } = await admin.from('teams').update({ name: body.name.trim() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
