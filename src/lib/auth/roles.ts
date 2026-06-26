import type { SupabaseClient } from '@supabase/supabase-js'
import type { GlobalRole, TeamRole } from '@/types'

/**
 * Role checks shared across API routes and server components.
 *
 * Global role lives on public.users.role (admin | user).
 * Team role lives on public.team_members.role (head | member).
 *
 * Pass a service-role (admin) client when reading another user's row,
 * since RLS would otherwise hide it.
 */

export async function getGlobalRole(
  client: SupabaseClient,
  userId: string
): Promise<GlobalRole | null> {
  const { data } = await client.from('users').select('role').eq('id', userId).single()
  return (data?.role as GlobalRole) ?? null
}

export async function isGlobalAdmin(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  return (await getGlobalRole(client, userId)) === 'admin'
}

export async function getTeamRole(
  client: SupabaseClient,
  teamId: string,
  userId: string
): Promise<TeamRole | null> {
  const { data } = await client
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single()
  return (data?.role as TeamRole) ?? null
}

/** Head of the given team OR a global admin — the "can manage this team's content" check. */
export async function canManageTeam(
  client: SupabaseClient,
  adminClient: SupabaseClient,
  teamId: string,
  userId: string
): Promise<boolean> {
  if (await isGlobalAdmin(adminClient, userId)) return true
  return (await getTeamRole(client, teamId, userId)) === 'head'
}
