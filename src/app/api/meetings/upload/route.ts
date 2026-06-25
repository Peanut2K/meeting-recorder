import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { transcribeAudio } from '@/lib/ai/transcribe'
import { summarizeMeeting } from '@/lib/ai/summarize'
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

  if (!file || !teamId || !title?.trim())
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Verify user is a member of the team
  const { data: membership } = await supabase.from('team_members').select('role')
    .eq('team_id', teamId).eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'Not a team member' }, { status: 403 })

  // Create meeting record with processing status
  const { data: meeting, error: meetingError } = await admin
    .from('meetings')
    .insert({ team_id: teamId, title: title.trim(), recorded_by: user.id, status: 'processing' })
    .select().single()
  if (meetingError) {
    console.error('Meeting insert failed:', meetingError.message)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }

  const audioBuffer = Buffer.from(await file.arrayBuffer())
  const audioPath = `${teamId}/${meeting.id}.webm`

  const { error: storageError } = await admin.storage
    .from('meeting-audio').upload(audioPath, audioBuffer, { contentType: 'audio/webm' })

  if (storageError) {
    console.error('Storage upload failed:', storageError.message)
    await admin.from('meetings').update({ status: 'failed', error_message: 'Audio upload failed' }).eq('id', meeting.id)
    return NextResponse.json({ error: 'Audio upload failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('meeting-audio').getPublicUrl(audioPath)
  await admin.from('meetings').update({ audio_url: publicUrl }).eq('id', meeting.id)

  try {
    const transcript = await transcribeAudio(audioBuffer, `${meeting.id}.webm`)
    await admin.from('meetings').update({ transcript }).eq('id', meeting.id)

    const { data: template } = await admin.from('team_templates').select('fields').eq('team_id', teamId).single()
    const customFields: string[] = Array.isArray(template?.fields) ? template.fields : []

    const summary = await summarizeMeeting(transcript, customFields)
    await admin.from('summaries').insert({ meeting_id: meeting.id, content: summary, edited_by: user.id })
    await admin.from('meetings').update({ status: 'done' }).eq('id', meeting.id)

    return NextResponse.json({ meetingId: meeting.id })
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : 'Unknown error'
    console.error('AI processing failed:', detail)
    await admin.from('meetings').update({ status: 'failed', error_message: 'AI processing failed' }).eq('id', meeting.id)
    return NextResponse.json({ error: 'Meeting processing failed' }, { status: 500 })
  }
}
