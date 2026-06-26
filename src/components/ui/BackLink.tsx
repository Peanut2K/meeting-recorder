import Link from 'next/link'

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className="group inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-muted shadow-sm transition-all hover:border-brand/40 hover:text-brand hover:shadow">
      <span className="transition-transform group-hover:-translate-x-0.5">←</span>
      {children}
    </Link>
  )
}
