import Link from 'next/link'
import { format } from 'date-fns'
import { Meeting } from '@/types'

const statusColors: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
}

export function MeetingRow({ meeting }: { meeting: Meeting }) {
  return (
    <Link href={`/meetings/${meeting.id}`}
      className="flex items-center justify-between border rounded-xl p-4 hover:border-black transition-colors bg-white">
      <div>
        <p className="font-medium">{meeting.title}</p>
        <p className="text-sm text-gray-500">{format(new Date(meeting.created_at), 'dd MMM yyyy, HH:mm')}</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[meeting.status]}`}>
        {meeting.status}
      </span>
    </Link>
  )
}
