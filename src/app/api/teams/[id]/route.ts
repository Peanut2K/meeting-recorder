import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getCallerRole(supabase: any, teamId: string, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('team_members').select('role')
    .eq('team_id', teamId).eq('user_id', userId).single()
  return data?.role ?? null
}

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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (await getCallerRole(supabase, id, user.id) !== 'admin')
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: { name?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase.from('teams').update({ name: body.name.trim() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
