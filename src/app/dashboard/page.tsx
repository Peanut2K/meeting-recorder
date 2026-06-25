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
  }, [])

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Teams</h1>
        <Link href="/teams/new"><Button>+ New Team</Button></Link>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-8">{error}</p>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No teams yet.</p>
          <Link href="/teams/new"><Button className="mt-4">Create your first team</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {teams.map((t: any) => (
            <TeamCard key={t.teams.id} id={t.teams.id} name={t.teams.name} role={t.role} />
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
