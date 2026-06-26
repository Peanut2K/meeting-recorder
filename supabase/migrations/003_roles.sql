-- ============================================================
-- Role-Based Access Control
--
-- Global role on public.users (admin | user) and team role on
-- public.team_members renamed from admin/member to head/member.
--
-- Run in Supabase SQL Editor after 002_fix_rls_recursion.sql.
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Global role on public.users
-- ------------------------------------------------------------
alter table public.users
  add column if not exists role text not null default 'user'
    check (role in ('admin', 'user'));

-- ------------------------------------------------------------
-- STEP 2: Rename team role admin -> head
-- ------------------------------------------------------------
-- Drop the old check constraint (name is auto-generated as
-- team_members_role_check), migrate the data, then re-add.
alter table public.team_members
  drop constraint if exists team_members_role_check;

update public.team_members set role = 'head' where role = 'admin';

alter table public.team_members
  add constraint team_members_role_check check (role in ('head', 'member'));

-- ------------------------------------------------------------
-- STEP 3: Helper functions (SECURITY DEFINER — bypass RLS)
-- ------------------------------------------------------------

-- Is the current user a global admin?
create or replace function public.is_global_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Is the current user the head of this team?
create or replace function public.is_team_head(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid() and role = 'head'
  );
$$;

-- Replace the old admin-based helper from migration 002.
-- (is_team_admin checked role = 'admin', which no longer exists.)
create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_team_head(p_team_id);
$$;

-- ------------------------------------------------------------
-- STEP 4: Tighten write policies
-- ------------------------------------------------------------

-- teams: only a global admin may create or delete teams.
-- (App code uses the service-role client which bypasses RLS, but
--  these policies are the real security boundary for direct access.)
drop policy if exists "teams_insert" on public.teams;
create policy "teams_insert" on public.teams
  for insert with check ( public.is_global_admin() );

drop policy if exists "teams_delete" on public.teams;
create policy "teams_delete" on public.teams
  for delete using ( public.is_global_admin() );

-- team_members: only a global admin may add/remove members or set head.
drop policy if exists "team_members_insert" on public.team_members;
create policy "team_members_insert" on public.team_members
  for insert with check ( public.is_global_admin() );

drop policy if exists "team_members_delete" on public.team_members;
create policy "team_members_delete" on public.team_members
  for delete using ( public.is_global_admin() );

-- meetings: read for any team member; write (insert/update/delete)
-- only for the team head or a global admin.
drop policy if exists "meetings_team_member" on public.meetings;
create policy "meetings_select" on public.meetings
  for select using ( public.is_team_member(team_id) );
create policy "meetings_write" on public.meetings
  for all using ( public.is_team_head(team_id) or public.is_global_admin() )
  with check ( public.is_team_head(team_id) or public.is_global_admin() );

-- team_templates: read for any team member; write only for head/admin.
drop policy if exists "templates_team_member" on public.team_templates;
create policy "templates_select" on public.team_templates
  for select using ( public.is_team_member(team_id) );
create policy "templates_write" on public.team_templates
  for all using ( public.is_team_head(team_id) or public.is_global_admin() )
  with check ( public.is_team_head(team_id) or public.is_global_admin() );

-- ------------------------------------------------------------
-- STEP 5: Seed the first admin (edit the email, then run)
-- ------------------------------------------------------------
-- update public.users set role = 'admin' where email = 'you@example.com';
