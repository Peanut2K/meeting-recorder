import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { compressToMp3 } from '@/lib/ai/transcribe'
import { canManageTeam } from '@/lib/auth/roles'
import { tasks } from '@trigger.dev/sdk'
import type { processMeeting } from '@/trigger/process-meeting'
import { NextResponse } from 'next/server'

// Route only ingests + hands off. The long pipeline runs on Trigger.dev, so this
// stays well under Vercel's function timeout regardless of clip length.
export const maxDuration = 60

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

  // Optional custom meeting date — overrides the date portion of created_at but preserves current time.
  let createdAt: string | undefined
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const now = new Date()
    createdAt = new Date(Date.UTC(y, m - 1, d, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())).toISOString()
  }

  // Only the team head (or a global admin) may record/create meetings.
  if (!(await canManageTeam(supabase, admin, teamId, user.id)))
    return NextResponse.json({ error: 'Only the team head can record meetings' }, { status: 403 })

  // Create meeting record as queued — the Trigger.dev worker flips it to processing/done/failed.
  const { data: meeting, error: meetingError } = await admin
    .from('meetings')
    .insert({ team_id: teamId, title: title.trim(), recorded_by: user.id, status: 'queued', ...(createdAt && { created_at: createdAt }) })
    .select().single()
  if (meetingError) {
    console.error('Meeting insert failed:', meetingError.message)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }

  const audioBuffer = Buffer.from(await file.arrayBuffer())
  const audioPath = `${teamId}/${meeting.id}.mp3`

  // Compress here (fast, fits the route budget) then store. The worker downloads this
  // file and transcribes it as-is (alreadyMp3), so it MUST be mp3 — fail loudly if not.
  const compressedAudio = await compressToMp3(audioBuffer).catch(() => null)
  if (!compressedAudio) {
    await admin.from('meetings').delete().eq('id', meeting.id)
    return NextResponse.json({ error: 'Audio compression failed' }, { status: 500 })
  }
  const { error: storageError } = await admin.storage
    .from('meeting-audio').upload(audioPath, compressedAudio, { contentType: 'audio/mpeg' })
  if (storageError) {
    console.error('Storage upload failed:', storageError.message)
    await admin.from('meetings').delete().eq('id', meeting.id)
    return NextResponse.json({ error: 'Failed to store audio' }, { status: 500 })
  }
  const { data: { publicUrl } } = admin.storage.from('meeting-audio').getPublicUrl(audioPath)
  await admin.from('meetings').update({ audio_url: publicUrl }).eq('id', meeting.id)

  // Hand off to the worker and return immediately — user can close the tab.
  // alreadyMp3 only if compression actually succeeded.
  try {
    await tasks.trigger<typeof processMeeting>('process-meeting', {
      meetingId: meeting.id, teamId, audioPath, fileName: file.name,
    })
  } catch (err: unknown) {
    console.error('Failed to enqueue processing:', err instanceof Error ? err.message : err)
    await admin.from('meetings').update({ status: 'failed' }).eq('id', meeting.id)
    return NextResponse.json({ error: 'Failed to start processing' }, { status: 500 })
  }

  return NextResponse.json({ meetingId: meeting.id })
}
