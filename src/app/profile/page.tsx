'use client'
import { useEffect, useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {user ? (
        <div className="border rounded-xl p-6 max-w-sm bg-white">
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium mb-4">{user.email}</p>
          <p className="text-sm text-gray-500">Member since</p>
          <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      ) : (
        <p className="text-gray-500">Loading...</p>
      )}
    </PageWrapper>
  )
}
