import { task } from '@trigger.dev/sdk'
import { createClient } from '@supabase/supabase-js'
import { transcribeAudio } from '@/lib/ai/transcribe'
import { summarizeMeeting } from '@/lib/ai/summarize'

// Worker-side pipeline. Runs on Trigger.dev (no request timeout), so any-length
// clip transcribes here instead of in the Vercel function. Reuses the same
// transcribe/summarize libs the route used to call inline.
//
// maxDuration counts CPU time only (ffmpeg), not the I/O wait on Whisper/Anthropic —
// so a 2hr recording costs little CPU credit despite the long wall-clock.

export const processMeeting = task({
  id: 'process-meeting',
  // ponytail: small-1x (0.5GB) default. If a long raw upload OOMs on download,
  // bump to 'medium-1x' (1GB) — doubles credit burn, only change if it actually fails.
  retry: { maxAttempts: 2 },
  run: async (payload: { meetingId: string; teamId: string; audioPath: string; fileName: string }) => {
    const { meetingId, teamId, audioPath, fileName } = payload
    // Service-role client: worker runs outside any user session.
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await admin.from('meetings').update({ status: 'processing' }).eq('id', meetingId)

    try {
      const { data: blob, error: dlError } = await admin.storage.from('meeting-audio').download(audioPath)
      if (dlError || !blob) throw new Error(`Audio download failed: ${dlError?.message ?? 'no file'}`)
      const audioBuffer = Buffer.from(await blob.arrayBuffer())

      // Stored file is already compressed mono mp3 (uploaded that way by the route).
      const transcript = await transcribeAudio(audioBuffer, fileName, true)
        .catch((e: unknown) => { throw new Error(`Transcription (Whisper) failed: ${e instanceof Error ? e.message : e}`) })
      await admin.from('meetings').update({ transcript }).eq('id', meetingId)

      const { data: template } = await admin.from('team_templates').select('fields, prompt').eq('team_id', teamId).single()
      const customFields: string[] = Array.isArray(template?.fields) ? template.fields : []

      const summary = await summarizeMeeting(transcript, customFields, template?.prompt)
        .catch((e: unknown) => { throw new Error(`Summarization (Anthropic) failed: ${e instanceof Error ? e.message : e}`) })

      const { data: meeting } = await admin.from('meetings').select('recorded_by').eq('id', meetingId).single()
      const { error: summaryError } = await admin.from('summaries').insert({ meeting_id: meetingId, content: summary, edited_by: meeting?.recorded_by })
      if (summaryError) throw new Error(`Saving summary failed: ${summaryError.message}`)

      await admin.from('meetings').update({ status: 'done' }).eq('id', meetingId)
      return { meetingId, status: 'done' }
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : 'Unknown error'
      // Keep the row (status=failed) so the user sees *why* it failed instead of a vanished meeting.
      await admin.from('meetings').update({ status: 'failed' }).eq('id', meetingId)
      throw new Error(`Meeting processing failed: ${detail}`)
    }
  },
})
