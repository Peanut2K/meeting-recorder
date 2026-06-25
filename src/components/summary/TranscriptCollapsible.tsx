'use client'
import { useState } from 'react'

export function TranscriptCollapsible({ transcript }: { transcript: string | null }) {
  const [open, setOpen] = useState(false)
  if (!transcript) return null
  return (
    <div className="border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 font-medium hover:bg-gray-50 transition-colors">
        <span>Transcript</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap border-t">
          {transcript}
        </div>
      )}
    </div>
  )
}
