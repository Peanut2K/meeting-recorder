import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { NextResponse } from 'next/server'
import { renderPdf } from '@/lib/pdf/render'

// Render inline via the shared lib — the old child-process approach broke on Vercel
// (scripts/ wasn't bundled). serverExternalPackages handles the React-instance clash.
export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS limits this to meetings in the user's teams.
  const { data: meeting, error } = await supabase.from('meetings').select('*').eq('id', id).single()
  if (error || !meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  const { data: summaries } = await admin.from('summaries').select('content').eq('meeting_id', id)
  const content = summaries?.[0]?.content
  if (!content) return NextResponse.json({ error: 'No summary to export' }, { status: 400 })

  const { data: team } = await admin.from('teams').select('name').eq('id', meeting.team_id).single()
  const dateStr = format(new Date(meeting.created_at), 'yyyy-MM-dd')

  try {
    const buffer = await renderPdf({ title: meeting.title, date: dateStr, teamName: team?.name ?? '', content })
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="meeting-${dateStr}.pdf"`,
      },
    })
  } catch (e) {
    console.error('PDF render failed:', e)
    return new NextResponse(`PDF render failed: ${e instanceof Error ? e.message : e}`, { status: 500 })
  }
}
