'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { BackLink } from '@/components/ui/BackLink'
import { useToast } from '@/components/ui/Toast'
import { primeWebmDuration } from '@/lib/utils/audio'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { SummaryEditor } from '@/components/summary/SummaryEditor'
import { TranscriptCollapsible } from '@/components/summary/TranscriptCollapsible'
import { ExportButtons } from '@/components/summary/ExportButtons'
import { Meeting, Summary, Team, SummaryContent } from '@/types'

type MeetingWithSummary = Meeting & { summaries: Summary[]; audio_signed_url?: string | null }

export default function MeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [meeting, setMeeting] = useState<MeetingWithSummary | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [template, setTemplate] = useState<string[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const { toast, ToastContainer } = useToast()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/meetings/${meetingId}`)
      .then(r => r.ok ? r.json() : null)
      .then(async (data: MeetingWithSummary | null) => {
        if (!data) { setLoading(false); return }
        setMeeting(data)
        const [teamData, tmpl, me, teams] = await Promise.all([
          fetch(`/api/teams/${data.team_id}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/teams/${data.team_id}/template`).then(r => r.ok ? r.json() : { fields: [] }),
          fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
          fetch('/api/teams').then(r => r.ok ? r.json() : []),
        ])
        setTeam(teamData)
        setTemplate(tmpl.fields || [])
        const role = Array.isArray(teams) ? teams.find((t: any) => t.teams?.id === data.team_id)?.role : null
        setCanEdit(role === 'head' || me?.role === 'admin')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [meetingId])

  async function handleSave(content: SummaryContent) {
    const res = await fetch(`/api/meetings/${meetingId}/summary`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) toast('Saved!')
    else toast('Failed to save', 'error')
  }

  if (loading) return <PageWrapper><p className="text-gray-500">Loading...</p></PageWrapper>
  if (!meeting) return <PageWrapper><p className="text-red-500">Meeting not found.</p></PageWrapper>

  const dateStr = format(new Date(meeting.created_at), 'yyyy-MM-dd')
  // summaries is an array — use the first (and only) element
  const summary = meeting.summaries?.[0] ?? null

  return (
    <PageWrapper>
      <div className="mb-4">
        <BackLink href={`/teams/${meeting.team_id}`}>Back to team</BackLink>
      </div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{team?.name} · {format(new Date(meeting.created_at), 'dd MMM yyyy, HH:mm')}</p>
        </div>
        {summary && meeting.status === 'done' && (
          <ExportButtons
            meetingId={meetingId}
            title={meeting.title}
            date={dateStr}
            teamName={team?.name || ''}
            content={summary.content}
          />
        )}
      </div>

      <ToastContainer />
      {meeting.audio_signed_url && (
        <div className="mb-6 rounded-xl border border-line bg-surface p-4">
          <p className="mb-2 text-sm text-muted">Recording</p>
          <audio src={meeting.audio_signed_url} controls className="w-full" onLoadedMetadata={e => primeWebmDuration(e.currentTarget)} />
        </div>
      )}

      {meeting.status === 'processing' && (
        <div className="text-center py-12 text-gray-500">
          <p className="animate-pulse text-lg">Processing your meeting...</p>
          <p className="text-sm mt-2">This may take a few minutes. Refresh to check.</p>
        </div>
      )}

      {meeting.status === 'failed' && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Processing failed</p>
          <p className="text-sm text-red-500 mt-1">The audio could not be processed. Please try recording again.</p>
        </div>
      )}

      {meeting.status === 'done' && summary && (
        <div className="space-y-8">
          <SummaryEditor content={summary.content} customFields={template} onSave={handleSave} readOnly={!canEdit} />
          <TranscriptCollapsible transcript={meeting.transcript} />
        </div>
      )}
    </PageWrapper>
  )
}
