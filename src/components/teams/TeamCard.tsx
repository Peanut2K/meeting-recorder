import Link from 'next/link'

interface TeamCardProps {
  id: string
  name: string
  role: string
}

export function TeamCard({ id, name, role }: TeamCardProps) {
  const isHead = role === 'head'
  return (
    <Link href={`/teams/${id}`}
      className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-strong text-lg font-semibold text-white">
        {name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-lg">{name}</h3>
        <span className={`mt-0.5 inline-block text-xs capitalize ${isHead ? 'text-brand' : 'text-muted'}`}>
          {isHead ? 'Team head' : 'Member'}
        </span>
      </div>
      <span className="text-muted transition-all group-hover:translate-x-0.5 group-hover:text-brand">→</span>
    </Link>
  )
}
