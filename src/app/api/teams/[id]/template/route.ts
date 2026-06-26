import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageTeam } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('team_templates').select('*').eq('team_id', id).single()
  return NextResponse.json(data || { fields: [] })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only the team head (or a global admin) may edit the prompt/template.
  if (!(await canManageTeam(supabase, admin, id, user.id)))
    return NextResponse.json({ error: 'Only the team head can edit the prompt' }, { status: 403 })

  let body: { fields?: string[]; prompt?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { fields } = body
  if (!Array.isArray(fields)) return NextResponse.json({ error: 'fields must be an array' }, { status: 400 })

  const row: { team_id: string; fields: string[]; updated_at: string; prompt?: string | null } = {
    team_id: id, fields, updated_at: new Date().toISOString(),
  }
  if (typeof body.prompt === 'string') row.prompt = body.prompt.trim() || null

  const { data, error } = await supabase.from('team_templates')
    .upsert(row)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
