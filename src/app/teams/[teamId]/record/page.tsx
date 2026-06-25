'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RecordButton } from '@/components/recording/RecordButton'
import { ProcessingProgress } from '@/components/recording/ProcessingProgress'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Stage = 'record' | 'preview' | 'processing'

export default function RecordPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('record')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [title, setTitle] = useState('')
  const [processStep, setProcessStep] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  function handleRecordingComplete(blob: Blob) {
    setAudioBlob(blob)
    setAudioUrl(URL.createObjectURL(blob))
    setStage('preview')
  }

  async function handleUpload() {
    if (!audioBlob || !title.trim()) return
    setError('')
    setStage('processing')
    setProcessStep(0)

    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('teamId', teamId)
    formData.append('title', title)

    setProcessStep(1)
    try {
      const res = await fetch('/api/meetings/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        setStage('preview')
        return
      }

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
        <div className="flex flex-col items-center gap-8 py-12">
          <p className="text-gray-500">Press start to begin recording your meeting</p>
          <RecordButton onRecordingComplete={handleRecordingComplete} />
        </div>
      )}

      {stage === 'preview' && (
        <div className="flex flex-col gap-6 max-w-md">
          <div className="border rounded-xl p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">Preview</p>
            <audio src={audioUrl} controls className="w-full" />
          </div>
          <Input label="Meeting Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sprint Planning Week 26" required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => {
              setStage('record')
              setAudioBlob(null)
              if (audioUrl) URL.revokeObjectURL(audioUrl)
              setAudioUrl('')
            }}>Re-record</Button>
            <Button onClick={handleUpload} disabled={!title.trim()}>Upload & Process</Button>
          </div>
        </div>
      )}

      {stage === 'processing' && <ProcessingProgress step={processStep} />}
    </PageWrapper>
  )
}
