# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-06-26T12:16:49.235Z
> Files: 80 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.gitignore` — Git ignore rules (~128 tok)
- `AGENTS.md` — This is NOT the Next.js you know (~82 tok)
- `CLAUDE.md` — OpenWolf (~60 tok)
- `next.config.ts` — Declares nextConfig (~102 tok)
- `package-lock.json` — npm lock file (~25457 tok)
- `package.json` — Node.js package manifest (~204 tok)
- `postcss.config.mjs` — Declares config (~26 tok)
- `README_SUPABASE.md` — Supabase Manual Setup Guide (~622 tok)
- `README.md` — Project documentation (~363 tok)
- `tsconfig.json` — TypeScript configuration (~192 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .github/workflows/

- `supabase-keepalive.yml` — CI: Supabase keep-alive (~236 tok)

## .remember/

- `.gitignore` — Git ignore rules (~1 tok)

## .remember/logs/

- `hook-errors.log` (~0 tok)
- `memory-2026-06-26.log` (~66 tok)

## docs/superpowers/specs/

- `2026-06-26-role-based-access-design.md` — Role-Based Access Control — Design (~818 tok)

## scripts/

- `render-pdf.mjs` — Standalone PDF renderer — run as its own node process so @react-pdf/renderer (~877 tok)

## src/

- `middleware.ts` — Exports middleware, config (~322 tok)

## src/app/

- `globals.css` — Styles: 5 rules, 14 vars (~210 tok)
- `layout.tsx` — inter (~151 tok)
- `page.tsx` — RootPage (~31 tok)

## src/app/admin/

- `page.tsx` — AdminPage — renders form (~3450 tok)

## src/app/api/admin/teams/

- `route.ts` — GET — list all teams with their members (global admin only) (~269 tok)

## src/app/api/admin/users/

- `route.ts` — GET — list all users (global admin only) (~782 tok)

## src/app/api/admin/users/[userId]/

- `route.ts` — PATCH — change a user's global role (global admin only) (~921 tok)

## src/app/api/auth/login/

- `route.ts` — Next.js API route: POST (~210 tok)

## src/app/api/auth/logout/

- `route.ts` — Next.js API route: POST (~100 tok)

## src/app/api/auth/me/

- `route.ts` — GET — the current user's profile, including their global role. (~188 tok)

## src/app/api/auth/register/

- `route.ts` — Next.js API route: POST (~453 tok)

## src/app/api/meetings/[id]/

- `route.ts` — Next.js API route: GET, DELETE (~665 tok)

## src/app/api/meetings/[id]/pdf/

- `route.ts` — Render the PDF in a separate node process (scripts/render-pdf.mjs). Rendering (~759 tok)

## src/app/api/meetings/[id]/summary/

- `route.ts` — Next.js API route: PUT (~450 tok)

## src/app/api/meetings/upload/

- `route.ts` — Next.js API route: POST (~1263 tok)

## src/app/api/teams/

- `route.ts` — Next.js API route: GET, POST (~635 tok)

## src/app/api/teams/[id]/

- `route.ts` — Next.js API route: GET, PUT (~528 tok)

## src/app/api/teams/[id]/meetings/

- `route.ts` — Next.js API route: GET (~376 tok)

## src/app/api/teams/[id]/members/

- `route.ts` — Next.js API route: POST (~458 tok)

## src/app/api/teams/[id]/members/[userId]/

- `route.ts` — PATCH — change a member's team role (head | member); global admin only (~849 tok)

## src/app/api/teams/[id]/template/

- `route.ts` — Next.js API route: GET, PUT (~575 tok)

## src/app/dashboard/

- `page.tsx` — DashboardPage (~745 tok)

## src/app/login/

- `page.tsx` — LoginPage — renders form (~667 tok)

## src/app/meetings/[meetingId]/

- `page.tsx` — MeetingPage (~1389 tok)

## src/app/profile/

- `page.tsx` — ProfilePage — uses useEffect (~271 tok)

## src/app/register/

- `page.tsx` — RegisterPage — renders form — uses useRouter, useState (~600 tok)

## src/app/teams/[teamId]/

- `page.tsx` — TeamPage (~1309 tok)

## src/app/teams/[teamId]/record/

- `page.tsx` — RecordPage (~1263 tok)

## src/app/teams/[teamId]/settings/

- `page.tsx` — TeamSettingsPage (~1205 tok)

## src/app/teams/new/

- `page.tsx` — NewTeamPage — renders form — uses useRouter, useState (~417 tok)

## src/components/layout/

- `Navbar.tsx` — AUTH_ROUTES (~479 tok)
- `PageWrapper.tsx` — PageWrapper (~43 tok)

## src/components/recording/

- `ProcessingProgress.tsx` — STEPS (~292 tok)
- `RecordButton.tsx` — RecordButton (~1258 tok)

## src/components/summary/

- `ExportButtons.tsx` — ExportButtons (~455 tok)
- `SummaryEditor.tsx` — SummaryEditor (~1220 tok)
- `TranscriptCollapsible.tsx` — TranscriptCollapsible — uses useState (~211 tok)

## src/components/teams/

- `MeetingRow.tsx` — statusStyles (~508 tok)
- `TeamCard.tsx` — TeamCard (~296 tok)

## src/components/ui/

- `BackLink.tsx` — BackLink (~141 tok)
- `Button.tsx` — Button (~294 tok)
- `Input.tsx` — Input (~240 tok)

## src/lib/ai/

- `prompt.ts` — Shared between the server-side summarizer and the settings UI (no SDK import here, (~388 tok)
- `summarize.ts` — Exports summarizeMeeting (~318 tok)
- `transcribe.ts` — Typhoon ASR is OpenAI-compatible — Thai-optimized speech-to-text from SCB 10X. (~514 tok)

## src/lib/auth/

- `roles.ts` — Role checks shared across API routes and server components. (~435 tok)
- `roles.ts` — RBAC helpers: getGlobalRole/isGlobalAdmin (users.role admin|user), getTeamRole/canManageTeam (team_members.role head|member). Pass admin client to read other users (RLS) (~520 tok)

## src/lib/pdf/

- `MeetingPdf.tsx` — react-pdf's built-in Helvetica has no Thai glyphs, so Thai summaries render as blank (~854 tok)

## src/lib/supabase/

- `admin.ts` — Exports createAdminClient (~100 tok)
- `client.ts` — Exports createClient (~61 tok)
- `server.ts` — Exports createClient (~194 tok)

## src/lib/utils/

- `audio.ts` — MediaRecorder WebM blobs ship without a duration header, so audio.duration is Infinity (~131 tok)
- `cn.ts` — Exports cn (~48 tok)
- `markdown.ts` — Exports summaryToMarkdown (~193 tok)

## src/types/

- `ffmpeg-installer.d.ts` — Declares ffmpeg (~35 tok)
- `index.ts` — Exports GlobalRole, TeamRole, MeetingStatus, UserProfile + 7 more (~336 tok)

## supabase/migrations/

- `001_initial_schema.sql` — Meeting Recorder & Summarizer — Initial Schema (~1584 tok)
- `002_fix_rls_recursion.sql` — ============================================================ (~886 tok)
- `003_roles.sql` — ============================================================ (~1235 tok)
- `004_seed_first_admin.sql` — ============================================================ (~289 tok)
- `005_flexible_template.sql` — Per-team editable base prompt for the summarizer (null = use the app default). (~42 tok)
