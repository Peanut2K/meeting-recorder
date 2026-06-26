-- ============================================================
-- Seed the first admin account
--
-- There is no self-registration, so the very first admin must be
-- created by hand. Do it in TWO steps:
--
-- STEP A — create the auth user (Dashboard, recommended):
--   Supabase Dashboard -> Authentication -> Users -> "Add user"
--     Email:           <your-email>
--     Password:        <your-password>
--     Auto Confirm User: ON   (so you can log in immediately)
--   Click "Create user".
--
-- STEP B — give that user a public.users profile + admin role.
--   Edit the email/name below, then run this in the SQL Editor.
--   It reads the id from auth.users, so you don't paste any UUID.
-- ============================================================

insert into public.users (id, email, name, role)
select id, email, 'Admin', 'admin'
from auth.users
where email = 'sapon2548@gmail.com'   -- <-- change to your email
on conflict (id) do update
  set role = 'admin', name = excluded.name;

-- Verify:
-- select id, email, name, role from public.users where role = 'admin';
