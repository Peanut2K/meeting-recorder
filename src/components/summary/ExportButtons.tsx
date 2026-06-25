'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SummaryContent } from '@/types'
import { summaryToMarkdown } from '@/lib/utils/markdown'

interface ExportButtonsProps {
  title: string
  date: string
  teamName: string
  content: SummaryContent
}

export function ExportButtons({ title, date, teamName, content }: ExportButtonsProps) {
  const [copying, setCopying] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function exportPdf() {
    setExporting(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { MeetingPdf } = await import('@/lib/pdf/MeetingPdf')
      const { createElement } = await import('react')
      const blob = await pdf(createElement(MeetingPdf, { title, date, teamName, content })).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meeting-${date}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function copyMarkdown() {
    setCopying(true)
    const md = summaryToMarkdown(title, date, teamName, content)
    await navigator.clipboard.writeText(md)
    setTimeout(() => setCopying(false), 1500)
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={copyMarkdown} loading={copying}>
        {copying ? 'Copied!' : 'Copy Markdown'}
      </Button>
      <Button variant="secondary" onClick={exportPdf} loading={exporting}>Export PDF</Button>
    </div>
  )
}
