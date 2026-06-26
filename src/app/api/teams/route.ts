import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGlobalAdmin } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('team_members')
    .select('role, teams(id, name, created_at)')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: { name?: string; headUserId?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { name, headUserId } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  // The team's first member (its head) defaults to the admin creating it,
  // but an admin can nominate a different user as head.
  const headId = headUserId?.trim() || user.id

  const { data: team, error: teamError } = await admin
    .from('teams').insert({ name: name.trim() }).select().single()
  if (teamError) return NextResponse.json({ error: teamError.message }, { status: 500 })

  const { error: memberError } = await admin
    .from('team_members').insert({ team_id: team.id, user_id: headId, role: 'head' })

  if (memberError) {
    // Roll back the team creation to avoid orphaned teams
    await admin.from('teams').delete().eq('id', team.id)
    console.error('team_members insert failed:', memberError)
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  return NextResponse.json(team, { status: 201 })
}
