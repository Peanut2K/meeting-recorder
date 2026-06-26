import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGlobalAdmin } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

// GET — list all teams with their members (global admin only)
export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isGlobalAdmin(admin, user.id)))
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { data, error } = await admin
    .from('teams')
    .select('id, name, created_at, team_members(user_id, role, users(id, name, email))')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
