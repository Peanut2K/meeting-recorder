'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MeetingRow } from '@/components/teams/MeetingRow'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Meeting } from '@/types'

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [team, setTeam] = useState<any>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [isHead, setIsHead] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadMeetings = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (date) params.set('date', date)
    const res = await fetch(`/api/teams/${teamId}/meetings?${params}`)
    if (res.ok) {
      const data = await res.json()
      setMeetings(Array.isArray(data) ? data : [])
    }
  }, [teamId, search, date])

  useEffect(() => {
    Promise.all([
      fetch(`/api/teams/${teamId}`).then(r => r.ok ? r.json() : null),
      fetch('/api/teams').then(r => r.ok ? r.json() : []),
    ]).then(([teamData, teamsData]) => {
      setTeam(teamData)
      const t = Array.isArray(teamsData) ? teamsData.find((t: any) => t.teams?.id === teamId) : null
      setIsHead(t?.role === 'head')
      setLoading(false)
    })
    loadMeetings()
  }, [teamId])

  useEffect(() => { loadMeetings() }, [loadMeetings])

  async function handleDelete(id: string) {
    if (!confirm('Delete this meeting? This cannot be undone.')) return
    const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
    if (res.ok) setMeetings(ms => ms.filter(m => m.id !== id))
    else alert((await res.json().catch(() => ({}))).error ?? 'Could not delete meeting')
  }

  if (loading) return <PageWrapper><p className="text-gray-500">Loading...</p></PageWrapper>

  return (
    <PageWrapper>
      <div className="mb-4">
        <BackLink href="/dashboard">Back to teams</BackLink>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{team?.name || 'Team'}</h1>
        <div className="flex gap-2">
          {isHead && <Link href={`/teams/${teamId}/settings`}><Button variant="secondary">Settings</Button></Link>}
          {isHead && <Link href={`/teams/${teamId}/record`}><Button>+ Record Meeting</Button></Link>}
        </div>
      </div>
      <div className="flex gap-3 mb-6">
        <Input placeholder="Search meetings..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        {date && <Button variant="secondary" onClick={() => setDate('')}>Clear</Button>}
      </div>
      <div className="space-y-3">
        {meetings.length === 0
          ? <p className="text-center text-gray-400 py-12">No meetings yet.</p>
          : meetings.map(m => <MeetingRow key={m.id} meeting={m} onDelete={isHead ? handleDelete : undefined} />)}
      </div>
    </PageWrapper>
  )
}
