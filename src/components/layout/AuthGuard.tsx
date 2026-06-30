'use client'
import { useEffect } from 'react'

// Patches window.fetch once so any API call that returns 401 (expired session)
// bounces the user to /login. Middleware already handles page navigations; this
// covers in-page fetches that would otherwise fail silently.
export function AuthGuard() {
  useEffect(() => {
    const orig = window.fetch
    window.fetch = async (...args) => {
      const res = await orig(...args)
      if (res.status === 401 && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
      return res
    }
    return () => { window.fetch = orig }
  }, [])
  return null
}
