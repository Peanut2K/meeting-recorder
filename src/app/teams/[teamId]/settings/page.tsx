'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { DEFAULT_SUMMARY_PROMPT } from '@/lib/ai/prompt'

export default function TeamSettingsPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [team, setTeam] = useState<any>(null)
  const [customFields, setCustomFields] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
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
    fetch(`/api/teams/${teamId}/template`).then(r => r.json()).then(d => {
      setCustomFields(d.fields || [])
      setPrompt(d.prompt || '')
    })
  }, [teamId])

  async function saveTemplate() {
    const res = await fetch(`/api/teams/${teamId}/template`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: customFields, prompt }),
    })
    if (res.ok) notify('Saved!')
    else notify('Failed to save', 'error')
  }

  if (!team) return <PageWrapper><p className="text-gray-500">Loading...</p></PageWrapper>

  return (
    <PageWrapper>
      <div className="mb-4">
        <BackLink href={`/teams/${teamId}`}>Back to team</BackLink>
      </div>
      <h1 className="text-2xl font-bold mb-8">Team Settings — {team.name}</h1>
      {msg && <p className={`mb-4 text-sm ${msgType === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
      <p className="text-sm text-muted mb-8">Members are managed by an administrator in the Admin panel.</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-1">Summary Prompt</h2>
        <p className="text-sm text-muted mb-3">
          The base instruction the AI uses to summarize meetings. Leave blank to use the default.
        </p>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={5}
          placeholder={DEFAULT_SUMMARY_PROMPT}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-brand outline-none resize-y"
        />
        {!prompt && (
          <button onClick={() => setPrompt(DEFAULT_SUMMARY_PROMPT)} className="mt-2 text-xs text-brand hover:underline">
            Load the default prompt to edit →
          </button>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-1">Custom Summary Sections</h2>
        <p className="text-sm text-muted mb-4">Extra named sections the AI will fill in (e.g. &ldquo;Risks&rdquo;, &ldquo;Next steps&rdquo;).</p>
        <div className="space-y-2 mb-4">
          {customFields.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="border border-line rounded px-3 py-1 text-sm flex-1">{f}</span>
              <Button variant="secondary" className="text-xs" onClick={() => setCustomFields(customFields.filter((_, j) => j !== i))}>×</Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="New section name" value={newField} onChange={e => setNewField(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newField.trim()) { setCustomFields([...customFields, newField.trim()]); setNewField('') } } }} />
          <Button variant="secondary" onClick={() => { if (newField.trim()) { setCustomFields([...customFields, newField.trim()]); setNewField('') } }}>Add</Button>
        </div>
      </section>

      <Button onClick={saveTemplate}>Save Settings</Button>
    </PageWrapper>
  )
}
