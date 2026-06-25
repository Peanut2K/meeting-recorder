'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { SummaryEditor } from '@/components/summary/SummaryEditor'
import { TranscriptCollapsible } from '@/components/summary/TranscriptCollapsible'
import { ExportButtons } from '@/components/summary/ExportButtons'
import { Meeting, Summary, Team, SummaryContent } from '@/types'

type MeetingWithSummary = Meeting & { summaries: Summary[] }

export default function MeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [meeting, setMeeting] = useState<MeetingWithSummary | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [template, setTemplate] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/meetings/${meetingId}`)
      .then(r => r.ok ? r.json() : null)
      .then(async (data: MeetingWithSummary | null) => {
        if (!data) { setLoading(false); return }
        setMeeting(data)
        const [teamData, tmpl] = await Promise.all([
          fetch(`/api/teams/${data.team_id}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/teams/${data.team_id}/template`).then(r => r.ok ? r.json() : { fields: [] }),
        ])
        setTeam(teamData)
        setTemplate(tmpl.fields || [])
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
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  if (loading) return <PageWrapper><p className="text-gray-500">Loading...</p></PageWrapper>
  if (!meeting) return <PageWrapper><p className="text-red-500">Meeting not found.</p></PageWrapper>

  const dateStr = format(new Date(meeting.created_at), 'yyyy-MM-dd')
  // summaries is an array — use the first (and only) element
  const summary = meeting.summaries?.[0] ?? null

  return (
    <PageWrapper>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{team?.name} · {format(new Date(meeting.created_at), 'dd MMM yyyy, HH:mm')}</p>
        </div>
        {summary && meeting.status === 'done' && (
          <ExportButtons
            title={meeting.title}
            date={dateStr}
            teamName={team?.name || ''}
            content={summary.content}
          />
        )}
      </div>

      {saved && <p className="text-sm text-green-600 mb-4">Saved!</p>}

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
          <SummaryEditor content={summary.content} customFields={template} onSave={handleSave} />
          <TranscriptCollapsible transcript={meeting.transcript} />
        </div>
      )}
    </PageWrapper>
  )
}
