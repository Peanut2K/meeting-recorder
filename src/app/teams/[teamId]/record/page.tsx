'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RecordButton } from '@/components/recording/RecordButton'
import { ProcessingProgress } from '@/components/recording/ProcessingProgress'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { primeWebmDuration } from '@/lib/utils/audio'

type Stage = 'record' | 'preview' | 'processing'

export default function RecordPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('record')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [processStep, setProcessStep] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }
  }, [audioUrl])

  function startPreview(blob: Blob) {
    setAudioBlob(blob)
    setAudioUrl(URL.createObjectURL(blob))
    setStage('preview')
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    startPreview(file)
  }

  async function handleUpload() {
    if (!audioBlob || !title.trim()) return
    const resolvedTitle = title.trim()
    setError('')
    setStage('processing')
    setProcessStep(0)

    const formData = new FormData()
    const filename = audioBlob instanceof File ? audioBlob.name : 'recording.webm'
    formData.append('audio', audioBlob, filename)
    formData.append('teamId', teamId)
    formData.append('title', resolvedTitle)
    formData.append('date', date)

    setProcessStep(1)
    try {
      const res = await fetch('/api/meetings/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed'); setStage('preview'); return }
      setProcessStep(3)
      setTimeout(() => router.push(`/meetings/${data.meetingId}`), 300)
    } catch {
      setError('Network error — please try again')
      setStage('preview')
    }
  }

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-8">Record Meeting</h1>

      {stage === 'record' && (
        <div className="flex flex-col items-center gap-6 py-8">
          <p className="text-muted">Record live, or upload an existing audio / video file</p>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Input label="Meeting Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sprint Planning Week 26" />
            <Input label="Meeting Date" type="date" value={date} onChange={e => setDate(e.target.value)}
              onClick={e => e.currentTarget.showPicker?.()} className="cursor-pointer" />
          </div>
          <RecordButton onRecordingComplete={startPreview} />
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="h-px w-12 bg-line" /> or <span className="h-px w-12 bg-line" />
          </div>
          <label className="cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40 hover:text-brand">
            Upload audio / video file
            <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
      )}

      {stage === 'preview' && (
        <div className="flex flex-col gap-6 max-w-md">
          <div className="rounded-xl border border-line p-4 bg-bg">
            <p className="text-sm text-muted mb-2">Preview</p>
            <audio src={audioUrl} controls className="w-full" onLoadedMetadata={e => primeWebmDuration(e.currentTarget)} />
          </div>
          <Input label="Meeting Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sprint Planning Week 26" required />
          <Input label="Meeting Date" type="date" value={date} onChange={e => setDate(e.target.value)}
            onClick={e => e.currentTarget.showPicker?.()} className="cursor-pointer" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => {
              setStage('record'); setAudioBlob(null)
              if (audioUrl) URL.revokeObjectURL(audioUrl)
              setAudioUrl('')
            }}>Back</Button>
            <Button onClick={handleUpload} disabled={!title.trim()}>Upload & Process</Button>
          </div>
        </div>
      )}

      {stage === 'processing' && <ProcessingProgress step={processStep} />}
    </PageWrapper>
  )
}
