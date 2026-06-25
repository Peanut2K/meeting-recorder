import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user is a member of the team that owns this meeting
  const { data: meeting } = await supabase.from('meetings').select('team_id').eq('id', id).single()
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  const { data: membership } = await supabase.from('team_members').select('role')
    .eq('team_id', meeting.team_id).eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { content?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  if (!body.content) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const { data, error } = await supabase.from('summaries')
    .update({ content: body.content, edited_by: user.id, updated_at: new Date().toISOString() })
    .eq('meeting_id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
