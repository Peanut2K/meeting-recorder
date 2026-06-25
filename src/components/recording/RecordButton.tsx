'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface RecordButtonProps {
  onRecordingComplete: (blob: Blob) => void
}

export function RecordButton({ onRecordingComplete }: RecordButtonProps) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        onRecordingComplete(blob)
      }

      mediaRecorder.start(1000)
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone access in your browser settings.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-4">
      {error && <p className="text-sm text-red-500 text-center max-w-sm">{error}</p>}
      {recording && (
        <div className="flex items-center gap-2 text-red-500 font-mono text-2xl">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          {fmt(seconds)}
        </div>
      )}
      {recording
        ? <Button variant="danger" onClick={stopRecording} className="px-8 py-3 text-base">Stop Recording</Button>
        : <Button onClick={startRecording} className="px-8 py-3 text-base">Start Recording</Button>
      }
    </div>
  )
}
