'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const AUTH_ROUTES = ['/login', '/register']

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  if (AUTH_ROUTES.includes(pathname)) return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="font-bold text-lg">MeetingAI</Link>
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-sm text-gray-600 hover:text-black">Profile</Link>
        <Button variant="secondary" onClick={handleLogout} className="text-sm py-1">Logout</Button>
      </div>
    </nav>
  )
}
