import Link from 'next/link'

interface TeamCardProps {
  id: string
  name: string
  role: string
}

export function TeamCard({ id, name, role }: TeamCardProps) {
  return (
    <Link href={`/teams/${id}`}
      className="block border rounded-xl p-5 hover:border-black transition-colors bg-white">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-lg">{name}</h3>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">{role}</span>
      </div>
    </Link>
  )
}
