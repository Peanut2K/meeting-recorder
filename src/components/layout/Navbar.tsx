'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const AUTH_ROUTES = ['/login']

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (AUTH_ROUTES.includes(pathname)) return
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(me => setIsAdmin(me?.role === 'admin'))
      .catch(() => setIsAdmin(false))
  }, [pathname])

  if (AUTH_ROUTES.includes(pathname)) return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const linkClass = (href: string) =>
    `text-sm transition-colors ${pathname === href ? 'text-brand font-medium' : 'text-muted hover:text-ink'}`

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-surface/80 px-6 py-3 backdrop-blur">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-xs font-bold text-white">P</span>
        PinupMeeting
      </Link>
      <div className="flex items-center gap-4">
        {isAdmin && <Link href="/admin" className={linkClass('/admin')}>Admin</Link>}
        <Link href="/profile" className={linkClass('/profile')}>Profile</Link>
        <Button variant="secondary" onClick={handleLogout} className="text-sm py-1">Logout</Button>
      </div>
    </nav>
  )
}
