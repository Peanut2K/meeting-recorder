import Link from 'next/link'
import { format } from 'date-fns'
import { Meeting } from '@/types'

const statusStyles: Record<string, { dot: string; text: string; pulse?: boolean }> = {
  done: { dot: 'bg-green-500', text: 'text-green-700' },
  processing: { dot: 'bg-amber-500', text: 'text-amber-700', pulse: true },
  failed: { dot: 'bg-red-500', text: 'text-red-700' },
}

export function MeetingRow({ meeting, onDelete }: { meeting: Meeting; onDelete?: (id: string) => void }) {
  const s = statusStyles[meeting.status] ?? { dot: 'bg-gray-400', text: 'text-muted' }
  return (
    <Link href={`/meetings/${meeting.id}`}
      className="group flex items-center justify-between rounded-xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      <div className="min-w-0">
        <p className="truncate font-medium group-hover:text-brand transition-colors">{meeting.title}</p>
        <p className="text-sm text-muted">{format(new Date(meeting.created_at), 'dd MMM yyyy, HH:mm')}</p>
      </div>
      <div className="flex items-center gap-4 pl-3">
        <span className={`flex items-center gap-1.5 text-xs font-medium capitalize ${s.text}`}>
          <span className={`h-2 w-2 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
          {meeting.status}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(meeting.id) }}
            aria-label={`Delete ${meeting.title}`}
            className="rounded-md p-1 text-muted opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100">
            🗑
          </button>
        )}
      </div>
    </Link>
  )
}
