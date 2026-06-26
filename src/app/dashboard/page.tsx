'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TeamCard } from '@/components/teams/TeamCard'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/teams')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) { setError(data.error ?? 'Failed to load teams'); return }
        // Filter out any rows where teams join returned null (data integrity guard)
        setTeams((Array.isArray(data) ? data : []).filter((t: any) => t.teams != null))
      })
      .catch(() => setError('Network error — please refresh'))
      .finally(() => setLoading(false))
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(me => setIsAdmin(me?.role === 'admin'))
      .catch(() => setIsAdmin(false))
  }, [])

  return (
    <PageWrapper>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
          {!loading && !error && teams.length > 0 && (
            <p className="mt-1 text-sm text-muted">{teams.length} team{teams.length === 1 ? '' : 's'}</p>
          )}
        </div>
        {isAdmin && <Link href="/admin"><Button>+ New Team</Button></Link>}
      </div>
      {loading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-[5.25rem] rounded-xl border border-line bg-surface animate-pulse" />)}
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-8">{error}</p>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center text-muted">
          <p className="text-lg">No teams yet.</p>
          {isAdmin
            ? <Link href="/admin"><Button className="mt-4">Create a team</Button></Link>
            : <p className="text-sm mt-2">Ask an administrator to add you to a team.</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {teams.map((t: any, i: number) => (
            <div key={t.teams.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <TeamCard id={t.teams.id} name={t.teams.name} role={t.role} />
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
