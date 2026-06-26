# Role-Based Access Control — Design

**Date:** 2026-06-26
**Status:** Approved

## Goal

Replace the open self-registration flow with an admin-managed user system and a
three-tier role model.

## Role Model

**Global role** — stored on `public.users.role`:
- `admin` — system administrator
- `user` — regular user (default)

**Team role** — stored on `public.team_members.role` (renamed from `admin`/`member`):
- `head` — head of that specific team
- `member` — team member

A user has exactly one global role, but a different team role per team (head of
team A, member of team B).

## Permissions

| Action | Admin | Head (of that team) | Member / User |
|---|:---:|:---:|:---:|
| Create / delete team | ✅ | ❌ | ❌ |
| Create / delete user, set global role | ✅ | ❌ | ❌ |
| Add / remove team members, assign head | ✅ | ❌ | ❌ |
| Edit team prompt / template | ✅ (any team) | ✅ (own team) | ❌ |
| Record / create meeting | ✅ | ✅ (own team) | ❌ |
| View meetings / transcript / summary | ✅ | ✅ | ✅ (teams they belong to) |

## Changes

### 1. Remove registration
- Delete `/register` page, `/api/auth/register` route, and the register link on `/login`.
- Remove `/register` from `PUBLIC_ROUTES` in `middleware.ts`.
- New users are created only through the Admin panel (service-role insert into
  `auth.users` + `public.users`).

### 2. Admin panel (`/admin`, global admin only)
Minimal scope:
- **Users:** create (email/password/name/global role), delete, change global role.
- **Teams:** create, delete, add/remove members, assign head vs member.

### 3. Schema migration (`003_roles.sql`)
- Add `role text not null default 'user' check (role in ('admin','user'))` to `public.users`.
- Migrate `team_members.role`: drop old check, rename existing `admin` → `head`,
  add new check `role in ('head','member')`.
- Add SECURITY DEFINER helpers: `is_global_admin()`, `is_team_head(team_id)`.
- RLS updates:
  - `team_templates`: write (insert/update) gated to head-of-team OR global admin;
    read stays member-level.
  - `meetings`: insert gated to head-of-team OR global admin; read stays member-level.
  - `teams` insert/delete and `team_members` insert/delete gated to global admin.

### 4. API routes
- `POST /api/meetings/upload`: reject if caller is not head of the team (or admin).
- `PUT /api/teams/[id]/template`: reject if caller is not head (or admin).
- New `/api/admin/users` (GET/POST/DELETE/PATCH role) and
  `/api/admin/teams` membership management — all guarded by global-admin check.
- `POST /api/teams` (create) stays admin-only.

### 5. UI gating
- Hide "New Team" unless global admin.
- Hide record/upload button unless head of the team.
- Hide prompt/template edit unless head of that team (or admin).
- Add `/admin` nav link for global admins only.

### 6. Types
- `UserRole` → split into `GlobalRole = 'admin' | 'user'` and
  `TeamRole = 'head' | 'member'`. Update `TeamMember.role` to `TeamRole`.
- Add `role: GlobalRole` to the user profile shape.

## Bootstrapping

No registration means the first admin is seeded manually via Supabase SQL:
```sql
update public.users set role = 'admin' where email = '<your-email>';
```

## Out of Scope (YAGNI)
- Invite links / email invitations.
- Per-user audit logs.
- Granular per-field template permissions.
