'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MeetingRow } from '@/components/teams/MeetingRow'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Meeting } from '@/types'

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [team, setTeam] = useState<any>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [isHead, setIsHead] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const { toast, ToastContainer } = useToast()

  const loadMeetings = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`/api/teams/${teamId}/meetings?${params}`)
    if (res.ok) {
      const data = await res.json()
      setMeetings(Array.isArray(data) ? data : [])
    }
  }, [teamId, search, from, to])

  function presetDays(days: number) {
    const d = new Date(); d.setDate(d.getDate() - days)
    setFrom(d.toISOString().slice(0, 10)); setTo('')
  }

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
    setConfirmDelete(null)
    setMeetings(ms => ms.filter(m => m.id !== id))
    const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast('Meeting deleted', 'success')
    } else {
      const err = (await res.json().catch(() => ({}))).error ?? 'Could not delete meeting'
      toast(err, 'error')
      loadMeetings()
    }
  }

  if (loading) return <PageWrapper><p className="text-gray-500">Loading...</p></PageWrapper>

  return (
    <PageWrapper>
      <ToastContainer />
      {confirmDelete && (
        <ConfirmDialog
          message="Delete this meeting?"
          description="This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      <div className="mb-4">
        <BackLink href="/dashboard">Back to teams</BackLink>
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{team?.name || 'Team'}</h1>
          {isHead && (
            <div className="hidden sm:flex gap-2">
              <Link href={`/teams/${teamId}/settings`}><Button variant="secondary">Settings</Button></Link>
              <Link href={`/teams/${teamId}/record`}><Button>+ Record Meeting</Button></Link>
            </div>
          )}
        </div>
        {isHead && (
          <div className="flex sm:hidden gap-2 mt-3">
            <Link href={`/teams/${teamId}/settings`}><Button variant="secondary">Settings</Button></Link>
            <Link href={`/teams/${teamId}/record`}><Button>+ Record Meeting</Button></Link>
          </div>
        )}
      </div>
      <div className="mb-3">
        <Input placeholder="Search meetings..." value={search} onChange={e => setSearch(e.target.value)} className="w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button variant="secondary" className="text-sm py-1" onClick={() => presetDays(1)}>1 day</Button>
        <Button variant="secondary" className="text-sm py-1" onClick={() => presetDays(7)}>7 days</Button>
        <Button variant="secondary" className="text-sm py-1" onClick={() => presetDays(30)}>1 month</Button>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} aria-label="From date"
          onClick={e => e.currentTarget.showPicker?.()}
          className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-sm text-white hover:bg-brand-strong [&::-webkit-calendar-picker-indicator]:invert" />
        <span className="text-muted">–</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} aria-label="To date"
          onClick={e => e.currentTarget.showPicker?.()}
          className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-sm text-white hover:bg-brand-strong [&::-webkit-calendar-picker-indicator]:invert" />
        {(from || to) && <Button variant="secondary" className="text-sm py-1" onClick={() => { setFrom(''); setTo('') }}>Clear</Button>}
      </div>
      <div className="space-y-3">
        {meetings.length === 0
          ? <p className="text-center text-gray-400 py-12">No meetings yet.</p>
          : meetings.map(m => <MeetingRow key={m.id} meeting={m} onDelete={isHead ? setConfirmDelete : undefined} />)}
      </div>
    </PageWrapper>
  )
}
