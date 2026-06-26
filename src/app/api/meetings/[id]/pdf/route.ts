import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { format } from 'date-fns'
import { NextResponse } from 'next/server'

// Render the PDF in a separate node process (scripts/render-pdf.mjs). Rendering
// @react-pdf/renderer inside Next throws "Cannot read properties of null (reading
// 'props')" because Next's vendored React and the external react-pdf end up as two
// different React instances; a plain node process sidesteps that entirely.
function renderPdf(payload: object): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [join(process.cwd(), 'scripts/render-pdf.mjs')])
    const chunks: Buffer[] = []
    let err = ''
    proc.stdout.on('data', c => chunks.push(c))
    proc.stderr.on('data', c => { err += c })
    proc.on('error', reject)
    proc.on('close', code => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(err.trim() || `render exited ${code}`)))
    proc.stdin.write(JSON.stringify(payload))
    proc.stdin.end()
  })
}

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
