import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { transcribeAudio } from '@/lib/ai/transcribe'
import { summarizeMeeting } from '@/lib/ai/summarize'
import { canManageTeam } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try { formData = await request.formData() } catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

  const file = formData.get('audio') as File | null
  const teamId = formData.get('teamId') as string | null
  const title = formData.get('title') as string | null
  const dateStr = formData.get('date') as string | null

  if (!file || !teamId || !title?.trim())
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Optional custom meeting date — overrides created_at (used as the meeting date everywhere).
  const createdAt = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(dateStr).toISOString() : undefined

  // Only the team head (or a global admin) may record/create meetings.
  if (!(await canManageTeam(supabase, admin, teamId, user.id)))
    return NextResponse.json({ error: 'Only the team head can record meetings' }, { status: 403 })

  // Create meeting record with processing status
  const { data: meeting, error: meetingError } = await admin
    .from('meetings')
    .insert({ team_id: teamId, title: title.trim(), recorded_by: user.id, status: 'processing', ...(createdAt && { created_at: createdAt }) })
    .select().single()
  if (meetingError) {
    console.error('Meeting insert failed:', meetingError.message)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }

  const audioBuffer = Buffer.from(await file.arrayBuffer())
  const audioPath = `${teamId}/${meeting.id}.webm`

  const { error: storageError } = await admin.storage
    .from('meeting-audio').upload(audioPath, audioBuffer, { contentType: 'audio/webm' })

  // Non-fatal: transcription uses the in-memory buffer, not the stored file. A storage
  // hiccup (e.g. 504) only costs audio replay — it shouldn't lose the whole meeting.
  if (storageError) {
    console.error('Storage upload failed (continuing without saved audio):', storageError.message)
  } else {
    const { data: { publicUrl } } = admin.storage.from('meeting-audio').getPublicUrl(audioPath)
    await admin.from('meetings').update({ audio_url: publicUrl }).eq('id', meeting.id)
  }

  try {
    const transcript = await transcribeAudio(audioBuffer, `${meeting.id}.webm`)
      .catch((e: unknown) => { throw new Error(`Transcription (Typhoon) failed: ${e instanceof Error ? e.message : e}`) })
    await admin.from('meetings').update({ transcript }).eq('id', meeting.id)

    const { data: template } = await admin.from('team_templates').select('fields, prompt').eq('team_id', teamId).single()
    const customFields: string[] = Array.isArray(template?.fields) ? template.fields : []

    const summary = await summarizeMeeting(transcript, customFields, template?.prompt)
      .catch((e: unknown) => { throw new Error(`Summarization (Anthropic) failed: ${e instanceof Error ? e.message : e}`) })
    const { error: summaryError } = await admin.from('summaries').insert({ meeting_id: meeting.id, content: summary, edited_by: user.id })
    if (summaryError) throw new Error(`Saving summary failed: ${summaryError.message}`)
    await admin.from('meetings').update({ status: 'done' }).eq('id', meeting.id)

    return NextResponse.json({ meetingId: meeting.id })
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : 'Unknown error'
    console.error('AI processing failed:', detail)
    // Don't keep failed meetings — drop the row (and any uploaded audio) so the list stays clean.
    // The error still goes back to the user in the response below.
    await admin.storage.from('meeting-audio').remove([audioPath]).catch(() => {})
    await admin.from('meetings').delete().eq('id', meeting.id)
    return NextResponse.json({ error: `Meeting processing failed: ${detail}` }, { status: 500 })
  }
}
