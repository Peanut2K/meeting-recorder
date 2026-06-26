'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface RecordButtonProps {
  onRecordingComplete: (blob: Blob) => void
}

export function RecordButton({ onRecordingComplete }: RecordButtonProps) {
  const [recording, setRecording] = useState(false)
  const [includeSystem, setIncludeSystem] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamsRef = useRef<MediaStream[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function cleanup() {
    streamsRef.current.forEach(s => s.getTracks().forEach(t => t.stop()))
    streamsRef.current = []
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
  }

  async function startRecording() {
    setError('')
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamsRef.current = [micStream]

      // Mix mic + (optionally) tab/system audio into one track
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const dest = ctx.createMediaStreamDestination()
      ctx.createMediaStreamSource(micStream).connect(dest)

      if (includeSystem) {
        // getDisplayMedia needs a video request to expose tab/system audio; we drop the video.
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        streamsRef.current.push(displayStream)
        if (displayStream.getAudioTracks().length === 0) {
          cleanup()
          setError('No audio was shared. In the dialog, pick a tab or "Entire screen" and tick "Share tab/system audio".')
          return
        }
        ctx.createMediaStreamSource(displayStream).connect(dest)
        // If the user ends the screen share from the browser bar, stop recording too.
        displayStream.getVideoTracks()[0]?.addEventListener('ended', stopRecording)
      }

      const mediaRecorder = new MediaRecorder(dest.stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        cleanup()
        onRecordingComplete(blob)
      }

      mediaRecorder.start(1000)
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch (e) {
      cleanup()
      // NotAllowedError covers both a denied mic and a cancelled share dialog.
      setError(includeSystem
        ? 'Recording needs microphone access, and you must pick a tab/screen to share its audio.'
        : 'Microphone access denied. Please allow microphone access in your browser settings.')
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
      {!recording && (
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
          <input type="checkbox" checked={includeSystem} onChange={e => setIncludeSystem(e.target.checked)} className="accent-brand" />
          Also record call / tab audio (Discord, YouTube, Meet…)
        </label>
      )}
    </div>
  )
}
