-- ============================================================
-- Meeting Recorder & Summarizer — Initial Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Core Tables
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  created_at timestamptz default now()
);

-- Teams
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Team members with roles
create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  primary key (team_id, user_id)
);

-- Meetings
create table public.meetings (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade,
  title text not null,
  recorded_by uuid references public.users(id) on delete set null,
  audio_url text,
  transcript text,
  status text not null default 'processing'
    check (status in ('processing', 'done', 'failed')),
  error_message text,
  created_at timestamptz default now()
);

-- Summaries
create table public.summaries (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid references public.meetings(id) on delete cascade unique,
  content jsonb not null default '{}',
  edited_by uuid references public.users(id) on delete set null,
  updated_at timestamptz default now()
);

-- Team templates
create table public.team_templates (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade unique,
  fields jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Performance indexes
create index idx_meetings_team_created on public.meetings(team_id, created_at desc);
create index idx_team_members_user on public.team_members(user_id);

-- ============================================================
-- STEP 2: Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.meetings enable row level security;
alter table public.summaries enable row level security;
alter table public.team_templates enable row level security;

-- Users: only see own profile
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- Teams: see teams you're a member of
create policy "teams_member_select" on public.teams
  for select using (
    exists (
      select 1 from public.team_members
      where team_id = teams.id and user_id = auth.uid()
    )
  );
create policy "teams_insert" on public.teams
  for insert with check (true);

-- Team members: see members of your teams
create policy "team_members_select" on public.team_members
  for select using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id and tm.user_id = auth.uid()
    )
  );
create policy "team_members_insert" on public.team_members
  for insert with check (
    exists (
      select 1 from public.team_members existing
      where existing.team_id = team_members.team_id
        and existing.user_id = auth.uid()
        and existing.role = 'admin'
    )
  );
create policy "team_members_delete" on public.team_members
  for delete using (
    exists (
      select 1 from public.team_members admin_check
      where admin_check.team_id = team_members.team_id
        and admin_check.user_id = auth.uid()
        and admin_check.role = 'admin'
    )
  );

-- Meetings: see meetings of your teams
create policy "meetings_team_member" on public.meetings
  for all using (
    exists (
      select 1 from public.team_members
      where team_id = meetings.team_id and user_id = auth.uid()
    )
  );

-- Summaries: see summaries of meetings in your teams
create policy "summaries_team_member" on public.summaries
  for all using (
    exists (
      select 1 from public.meetings m
      join public.team_members tm on tm.team_id = m.team_id
      where m.id = summaries.meeting_id and tm.user_id = auth.uid()
    )
  );

-- Templates: see templates of your teams
create policy "templates_team_member" on public.team_templates
  for all using (
    exists (
      select 1 from public.team_members
      where team_id = team_templates.team_id and user_id = auth.uid()
    )
  );

-- ============================================================
-- STEP 3: Storage Policy (run AFTER creating the bucket)
-- Create bucket first: Dashboard → Storage → New bucket
--   Name: meeting-audio
--   Public: false
-- Then run this policy:
-- ============================================================

-- Note: This policy grants access to all authenticated users.
-- Team-scoping is enforced at the application layer (API routes check team membership).
create policy "audio_team_member" on storage.objects
  for all using (
    bucket_id = 'meeting-audio' and auth.uid() is not null
  );
