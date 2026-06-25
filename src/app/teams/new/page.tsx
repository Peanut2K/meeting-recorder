'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function NewTeamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create team'); return }
      router.push(`/teams/${data.id}`)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">Create Team</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <Input label="Team Name" value={name} onChange={e => setName(e.target.value)} required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={loading}>Create Team</Button>
      </form>
    </PageWrapper>
  )
}
