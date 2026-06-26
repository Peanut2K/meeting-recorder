import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageTeam } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS restricts this read to meetings in the user's teams — success proves membership.
  const { data: meeting, error } = await supabase.from('meetings').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Read the summary with admin: the nested-RLS join can return empty even for members.
  const { data: summaries } = await admin.from('summaries').select('*').eq('meeting_id', id)

  // Signed URL for the recording (bucket is private). Null if the object isn't there.
  const { data: signed } = await admin.storage.from('meeting-audio')
    .createSignedUrl(`${meeting.team_id}/${id}.webm`, 3600)

  return NextResponse.json({ ...meeting, summaries: summaries ?? [], audio_signed_url: signed?.signedUrl ?? null })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: meeting } = await admin.from('meetings').select('team_id').eq('id', id).single()
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  // Only the team head (or a global admin) may delete meetings.
  if (!(await canManageTeam(supabase, admin, meeting.team_id, user.id)))
    return NextResponse.json({ error: 'Only the team head can delete meetings' }, { status: 403 })

  await admin.storage.from('meeting-audio').remove([`${meeting.team_id}/${id}.webm`]).catch(() => {})
  await admin.from('meetings').delete().eq('id', id) // summaries cascade on delete
  return NextResponse.json({ ok: true })
}
