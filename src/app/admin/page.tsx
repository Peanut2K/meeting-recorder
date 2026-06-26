'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { UserProfile, GlobalRole, TeamRole } from '@/types'

interface AdminTeamMember {
  user_id: string
  role: TeamRole
  users: { id: string; name: string; email: string } | null
}
interface AdminTeam {
  id: string
  name: string
  created_at: string
  team_members: AdminTeamMember[]
}

export default function AdminPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [teams, setTeams] = useState<AdminTeam[]>([])
  const { toast, ToastContainer } = useToast()
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'user' | 'team'; id: string; label: string } | null>(null)

  // New-user form
  const [nu, setNu] = useState({ email: '', password: '', name: '', role: 'user' as GlobalRole })
  const [creatingUser, setCreatingUser] = useState(false)
  // New-team form
  const [newTeam, setNewTeam] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)

  const loadAll = useCallback(async () => {
    const [u, t] = await Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/teams').then(r => r.json()),
    ])
    if (Array.isArray(u)) setUsers(u)
    if (Array.isArray(t)) setTeams(t)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((me: UserProfile) => {
        if (me?.role !== 'admin') { router.replace('/dashboard'); return }
        setAllowed(true)
        loadAll()
      })
      .catch(() => router.replace('/dashboard'))
  }, [router, loadAll])

  async function createUser(e: React.FormEvent) {
    e.preventDefault(); setCreatingUser(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nu),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Failed to create user', 'error'); return }
      toast('User created')
      setNu({ email: '', password: '', name: '', role: 'user' })
      await loadAll()
    } finally { setCreatingUser(false) }
  }

  async function changeUserRole(userId: string, role: GlobalRole) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const d = await res.json()
    if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
    toast('Role updated'); await loadAll()
  }

  async function deleteUser(userId: string) {
    setConfirmDelete(null)
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) { toast(d.error ?? 'Failed to delete user', 'error'); return }
    toast('User deleted'); await loadAll()
  }

  async function setUserPassword(userId: string, password: string): Promise<boolean> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const d = await res.json()
    if (!res.ok) { toast(d.error ?? 'Failed to set password', 'error'); return false }
    toast('Password updated')
    return true
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault(); setCreatingTeam(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeam }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Failed to create team', 'error'); return }
      toast('Team created'); setNewTeam(''); await loadAll()
    } finally { setCreatingTeam(false) }
  }

  async function deleteTeam(teamId: string) {
    setConfirmDelete(null)
    const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) { toast(d.error ?? 'Failed to delete team', 'error'); return }
    toast('Team deleted'); await loadAll()
  }

  async function addMember(teamId: string, email: string, role: TeamRole) {
    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })
    const d = await res.json()
    if (!res.ok) { toast(d.error ?? 'Failed to add member', 'error'); return }
    toast('Member added'); await loadAll()
  }

  async function changeMemberRole(teamId: string, userId: string, role: TeamRole) {
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const d = await res.json()
    if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
    toast('Role updated'); await loadAll()
  }

  async function removeMember(teamId: string, userId: string) {
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
    toast('Member removed'); await loadAll()
  }

  if (allowed === null) return <PageWrapper><p className="text-gray-500">Loading...</p></PageWrapper>

  return (
    <PageWrapper>
      <ToastContainer />
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete ${confirmDelete.type === 'user' ? 'user' : 'team'} "${confirmDelete.label}"?`}
          description={confirmDelete.type === 'team' ? 'All meetings, summaries, and audio files will be permanently deleted.' : 'This cannot be undone.'}
          confirmLabel={`Delete ${confirmDelete.type === 'user' ? 'User' : 'Team'}`}
          onConfirm={() => confirmDelete.type === 'user' ? deleteUser(confirmDelete.id) : deleteTeam(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      <h1 className="text-3xl font-bold mb-8">Admin</h1>

      {/* ---- Users ---- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <form onSubmit={createUser} className="flex flex-wrap items-end gap-3 mb-6 p-4 border rounded-xl">
          <Input label="Name" value={nu.name} onChange={e => setNu({ ...nu, name: e.target.value })} required />
          <Input label="Email" type="email" value={nu.email} onChange={e => setNu({ ...nu, email: e.target.value })} required />
          <Input label="Password" type="password" value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nu.role} onChange={e => setNu({ ...nu, role: e.target.value as GlobalRole })}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <Button type="submit" loading={creatingUser}>Create user</Button>
        </form>

        <div className="border rounded-xl divide-y">
          {users.map(u => (
            <UserAdminRow key={u.id} u={u}
              onChangeRole={changeUserRole}
              onDelete={(id, label) => setConfirmDelete({ type: 'user', id, label })}
              onSetPassword={setUserPassword} />
          ))}
        </div>
      </section>

      {/* ---- Teams ---- */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Teams</h2>
        <form onSubmit={createTeam} className="flex items-end gap-3 mb-6 p-4 border rounded-xl">
          <Input label="Team name" value={newTeam} onChange={e => setNewTeam(e.target.value)} required />
          <Button type="submit" loading={creatingTeam}>Create team</Button>
        </form>

        <div className="flex flex-col gap-4">
          {teams.map(t => (
            <TeamAdminCard key={t.id} team={t} users={users}
              onAddMember={addMember}
              onChangeRole={changeMemberRole}
              onRemoveMember={removeMember}
              onDelete={(id, label) => setConfirmDelete({ type: 'team', id, label })} />
          ))}
        </div>
      </section>
    </PageWrapper>
  )
}

function UserAdminRow({ u, onChangeRole, onDelete, onSetPassword }: {
  u: UserProfile
  onChangeRole: (userId: string, role: GlobalRole) => void
  onDelete: (userId: string, label: string) => void
  onSetPassword: (userId: string, password: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [pwd, setPwd] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function save() {
    setSaving(true)
    const ok = await onSetPassword(u.id, pwd)
    setSaving(false)
    if (ok) { setDone(true); setPwd(''); setTimeout(() => { setDone(false); setOpen(false) }, 1500) }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{u.name}</p>
          <p className="text-sm text-gray-500">{u.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
            value={u.role} onChange={e => onChangeRole(u.id, e.target.value as GlobalRole)}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <Button variant="secondary" className="text-sm py-1" onClick={() => setOpen(o => !o)}>Set password</Button>
          <Button variant="danger" className="text-sm py-1" onClick={() => onDelete(u.id, u.name)}>Delete</Button>
        </div>
      </div>
      {open && (
        <div className="mt-3 flex items-end gap-2">
          {/* type=text on purpose: admin sets a new password and needs to read it back to hand over */}
          <Input label="New password" type="text" value={pwd} placeholder="min 6 characters"
            onChange={e => setPwd(e.target.value)} className="min-w-64" />
          <Button className="text-sm py-2" disabled={pwd.length < 6 || saving} loading={saving} onClick={save}>Save</Button>
          <Button variant="secondary" className="text-sm py-2" onClick={() => { setOpen(false); setPwd('') }}>Cancel</Button>
          {done && <span className="text-sm text-green-600 pb-2">Updated ✓</span>}
        </div>
      )}
    </div>
  )
}

function TeamAdminCard({ team, users, onAddMember, onChangeRole, onRemoveMember, onDelete }: {
  team: AdminTeam
  users: UserProfile[]
  onAddMember: (teamId: string, email: string, role: TeamRole) => void
  onChangeRole: (teamId: string, userId: string, role: TeamRole) => void
  onRemoveMember: (teamId: string, userId: string) => void
  onDelete: (teamId: string, label: string) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRole>('member')
  const memberIds = new Set(team.team_members.map(m => m.user_id))
  const available = users.filter(u => !memberIds.has(u.id))

  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{team.name}</h3>
        <Button variant="danger" className="text-sm py-1" onClick={() => onDelete(team.id, team.name)}>Delete team</Button>
      </div>
      <div className="divide-y mb-3">
        {team.team_members.map(m => (
          <div key={m.user_id} className="flex items-center justify-between py-2">
            <p className="text-sm">{m.users?.name} <span className="text-gray-500">· {m.users?.email}</span></p>
            <div className="flex items-center gap-2">
              <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                value={m.role} onChange={e => onChangeRole(team.id, m.user_id, e.target.value as TeamRole)}>
                <option value="member">member</option>
                <option value="head">head</option>
              </select>
              <Button variant="secondary" className="text-sm py-1" onClick={() => onRemoveMember(team.id, m.user_id)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Add member</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-56"
            value={email} onChange={e => setEmail(e.target.value)}>
            <option value="">Select user…</option>
            {available.map(u => (
              <option key={u.id} value={u.email}>{u.name} · {u.email}</option>
            ))}
          </select>
        </div>
        <select className="border border-gray-300 rounded-lg px-2 py-2 text-sm"
          value={role} onChange={e => setRole(e.target.value as TeamRole)}>
          <option value="member">member</option>
          <option value="head">head</option>
        </select>
        <Button className="text-sm py-2" disabled={!email} onClick={() => { if (email) { onAddMember(team.id, email, role); setEmail('') } }}>Add</Button>
      </div>
    </div>
  )
}
