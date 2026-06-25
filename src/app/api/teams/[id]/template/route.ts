import { createClient } from '@/lib/supabase/server'
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase.from('team_members').select('role')
    .eq('team_id', id).eq('user_id', user.id).single()
  if (membership?.role !== 'admin')
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: { fields?: string[] }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { fields } = body
  if (!Array.isArray(fields)) return NextResponse.json({ error: 'fields must be an array' }, { status: 400 })

  const { data, error } = await supabase.from('team_templates')
    .upsert({ team_id: id, fields, updated_at: new Date().toISOString() })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
