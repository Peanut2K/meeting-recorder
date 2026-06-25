# Supabase Manual Setup Guide

Before running the app, you must complete these three steps in the Supabase Dashboard.
All SQL lives in `supabase/migrations/001_initial_schema.sql` for reference.

---

## Step 1: Run the Database Schema + RLS Policies

1. Go to your Supabase project → **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy the entire file content and paste it into the SQL Editor
4. Click **Run**

This creates the following tables with Row Level Security enabled:

| Table | Description |
|---|---|
| `public.users` | User profiles extending `auth.users` |
| `public.teams` | Teams that own meetings |
| `public.team_members` | Team membership with `admin` / `member` roles |
| `public.meetings` | Meeting records with audio URL, transcript, status |
| `public.summaries` | AI-generated summaries (JSONB) per meeting |
| `public.team_templates` | Per-team summary field templates (JSONB) |

### Note on Team Creation and RLS

The `team_members_insert` policy requires the inserting user to already be an admin of the team. This is intentional and **does not break team creation** because the `POST /api/teams` route uses `createAdminClient()` (the service-role key), which bypasses RLS entirely. The initial admin member row is inserted via the service-role client, so the secured policy only applies to subsequent member additions performed by regular authenticated users.

---

## Step 2: Create the Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Set:
   - **Name:** `meeting-audio`
   - **Public:** off (leave unchecked)
4. Click **Save**

---

## Step 3: Run the Storage Policy

After creating the bucket, go back to **SQL Editor** and run:

```sql
create policy "audio_team_member" on storage.objects
  for all using (
    bucket_id = 'meeting-audio' and auth.uid() is not null
  );
```

This is also included at the bottom of `supabase/migrations/001_initial_schema.sql`.

---

## Verification Checklist

- [ ] All 6 tables visible in **Table Editor**
- [ ] RLS shown as enabled on each table (shield icon)
- [ ] `meeting-audio` bucket exists in **Storage**
- [ ] Storage policy `audio_team_member` visible under bucket policies

---

## Environment Variables

Make sure your `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Find these under **Project Settings → API**.
