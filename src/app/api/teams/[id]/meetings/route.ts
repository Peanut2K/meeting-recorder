import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user is a member of the team
  const { data: membership } = await supabase.from('team_members').select('role')
    .eq('team_id', id).eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const date = url.searchParams.get('date') || ''

  let query = supabase.from('meetings').select('*')
    .eq('team_id', id)
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('title', `%${search}%`)
  if (date) query = query.gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
