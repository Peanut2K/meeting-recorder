'use client'
import { useEffect, useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast, ToastContainer } = useToast()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast('Passwords do not match', 'error'); return }
    if (newPassword.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) toast(error.message, 'error')
    else { toast('Password changed successfully'); setNewPassword(''); setConfirmPassword('') }
  }

  return (
    <PageWrapper>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {user ? (
        <div className="flex flex-col gap-6 max-w-sm">
          <div className="border border-line rounded-xl p-6 bg-surface">
            <p className="text-sm text-muted">Email</p>
            <p className="font-medium mb-4">{user.email}</p>
            <p className="text-sm text-muted">Member since</p>
            <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>

          <div className="border border-line rounded-xl p-6 bg-surface">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
                {loading ? 'Saving…' : 'Change Password'}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <p className="text-muted">Loading...</p>
      )}
    </PageWrapper>
  )
}
