import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET — the current user's profile, including their global role.
// Used by the client to gate admin-only UI.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('users').select('id, email, name, role').eq('id', user.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
