import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageTeam } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: meeting } = await supabase.from('meetings').select('team_id').eq('id', id).single()
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  // Only the team head (or a global admin) may edit the summary — members are read-only.
  if (!(await canManageTeam(supabase, admin, meeting.team_id, user.id)))
    return NextResponse.json({ error: 'Only the team head can edit the summary' }, { status: 403 })

  let body: { content?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  if (!body.content) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const { data, error } = await admin.from('summaries')
    .update({ content: body.content, edited_by: user.id, updated_at: new Date().toISOString() })
    .eq('meeting_id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
