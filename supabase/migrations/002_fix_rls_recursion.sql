-- ============================================================
-- Fix: "infinite recursion detected in policy for relation team_members"
--
-- Cause: the RLS policies on public.team_members ran a subquery
-- against public.team_members itself. Evaluating that subquery
-- re-triggers the same policy, which loops forever.
--
-- Fix: move the membership/admin checks into SECURITY DEFINER
-- functions. A SECURITY DEFINER function runs with the owner's
-- privileges and BYPASSES RLS for the queries inside it, so the
-- inner read of team_members no longer re-invokes the policy.
--
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql.
-- ============================================================

-- Helper: is the current user a member of this team?
create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid()
  );
$$;

-- Helper: is the current user an admin of this team?
create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- Rewrite the recursive policies to call the helpers instead
-- ------------------------------------------------------------

-- team_members: a member can see the membership rows of their teams
drop policy if exists "team_members_select" on public.team_members;
create policy "team_members_select" on public.team_members
  for select using ( public.is_team_member(team_id) );

-- team_members: only an existing admin can add members
drop policy if exists "team_members_insert" on public.team_members;
create policy "team_members_insert" on public.team_members
  for insert with check ( public.is_team_admin(team_id) );

-- team_members: only an admin can remove members
drop policy if exists "team_members_delete" on public.team_members;
create policy "team_members_delete" on public.team_members
  for delete using ( public.is_team_admin(team_id) );

-- teams: see teams you're a member of (also referenced team_members)
drop policy if exists "teams_member_select" on public.teams;
create policy "teams_member_select" on public.teams
  for select using ( public.is_team_member(id) );

-- meetings: see meetings of your teams
drop policy if exists "meetings_team_member" on public.meetings;
create policy "meetings_team_member" on public.meetings
  for all using ( public.is_team_member(team_id) );

-- team_templates: see templates of your teams
drop policy if exists "templates_team_member" on public.team_templates;
create policy "templates_team_member" on public.team_templates
  for all using ( public.is_team_member(team_id) );

-- summaries: see summaries of meetings in your teams
drop policy if exists "summaries_team_member" on public.summaries;
create policy "summaries_team_member" on public.summaries
  for all using (
    exists (
      select 1 from public.meetings m
      where m.id = summaries.meeting_id and public.is_team_member(m.team_id)
    )
  );
