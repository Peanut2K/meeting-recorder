'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function TeamSettingsPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [team, setTeam] = useState<any>(null)
  const [newEmail, setNewEmail] = useState('')
  const [customFields, setCustomFields] = useState<string[]>([])
  const [newField, setNewField] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  function notify(message: string, type: 'success' | 'error' = 'success') {
    setMsg(message)
    setMsgType(type)
    setTimeout(() => setMsg(''), 3000)
  }

  async function loadTeam() {
    const res = await fetch(`/api/teams/${teamId}`)
    if (res.ok) setTeam(await res.json())
  }

  useEffect(() => {
    loadTeam()
    fetch(`/api/teams/${teamId}/template`).then(r => r.json()).then(d => setCustomFields(d.fields || []))
  }, [teamId])

  async function addMember() {
    if (!newEmail.trim()) return
    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim() }),
    })
    const data = await res.json()
    if (res.ok) { notify('Member added!'); setNewEmail(''); loadTeam() }
    else notify(data.error ?? 'Failed to add member', 'error')
  }

  async function removeMember(userId: string) {
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) { notify('Member removed'); loadTeam() }
    else notify(data.error ?? 'Failed to remove member', 'error')
  }

  async function saveTemplate() {
    const res = await fetch(`/api/teams/${teamId}/template`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: customFields }),
    })
    if (res.ok) notify('Template saved!')
    else notify('Failed to save template', 'error')
  }

  if (!team) return <PageWrapper><p className="text-gray-500">Loading...</p></PageWrapper>

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-8">Team Settings — {team.name}</h1>
      {msg && <p className={`mb-4 text-sm ${msgType === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Members</h2>
        <div className="space-y-2 mb-4">
          {team.team_members?.map((m: any) => (
            <div key={m.user_id} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium">{m.users?.name}</p>
                <p className="text-sm text-gray-500">{m.users?.email} · {m.role}</p>
              </div>
              <Button variant="danger" className="text-xs py-1" onClick={() => removeMember(m.user_id)}>Remove</Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Email address" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }} />
          <Button onClick={addMember}>Add Member</Button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Custom Summary Fields</h2>
        <div className="space-y-2 mb-4">
          {customFields.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="border rounded px-3 py-1 text-sm flex-1">{f}</span>
              <Button variant="secondary" className="text-xs" onClick={() => setCustomFields(customFields.filter((_, j) => j !== i))}>×</Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <Input placeholder="New field name" value={newField} onChange={e => setNewField(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newField.trim()) { setCustomFields([...customFields, newField.trim()]); setNewField('') } } }} />
          <Button variant="secondary" onClick={() => { if (newField.trim()) { setCustomFields([...customFields, newField.trim()]); setNewField('') } }}>Add Field</Button>
        </div>
        <Button onClick={saveTemplate}>Save Template</Button>
      </section>
    </PageWrapper>
  )
}
