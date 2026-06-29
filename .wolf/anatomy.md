# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-06-29T03:15:18.476Z
> Files: 27 tracked | Anatomy hits: 0 | Misses: 0

## ../../.claude/plans/

- `woolly-soaring-treehouse.md` — Fix: Whisper ByteString Error (~629 tok)

## ./

- `next.config.ts` — Declares nextConfig (~179 tok)
- `trigger.config.ts` — project ref ต้องมาจาก trigger.dev dashboard (ขึ้นต้น proj_...). ตั้งผ่าน env (~154 tok)

## .claude/


## .claude/rules/


## .github/workflows/


## .remember/


## .remember/logs/


## docs/superpowers/specs/


## scripts/


## src/

- `middleware.ts` — Exports middleware, config (~339 tok)

## src/app/


## src/app/admin/

- `page.tsx` — AdminPage — renders form (~4267 tok)

## src/app/api/admin/teams/


## src/app/api/admin/users/


## src/app/api/admin/users/[userId]/


## src/app/api/auth/login/


## src/app/api/auth/logout/


## src/app/api/auth/me/


## src/app/api/auth/register/


## src/app/api/meetings/[id]/

- `route.ts` — Next.js API route: GET, DELETE (~726 tok)

## src/app/api/meetings/[id]/pdf/

- `route.ts` — Render inline via the shared lib — the old child-process approach broke on Vercel (~554 tok)

## src/app/api/meetings/[id]/summary/


## src/app/api/meetings/upload/

- `route.ts` — Route only ingests + hands off. The long pipeline runs on Trigger.dev, so this (~1203 tok)

## src/app/api/teams/


## src/app/api/teams/[id]/

- `route.ts` — Next.js API route: GET, DELETE, PUT (~849 tok)

## src/app/api/teams/[id]/meetings/


## src/app/api/teams/[id]/members/


## src/app/api/teams/[id]/members/[userId]/


## src/app/api/teams/[id]/template/

- `route.ts` — Next.js API route: GET, PUT (~594 tok)

## src/app/dashboard/


## src/app/login/

- `page.tsx` — LoginPage — renders form (~666 tok)

## src/app/meetings/[meetingId]/

- `page.tsx` — MeetingPage (~1602 tok)

## src/app/profile/

- `page.tsx` — ProfilePage — renders form (~907 tok)

## src/app/register/


## src/app/teams/[teamId]/

- `page.tsx` — TeamPage (~1626 tok)

## src/app/teams/[teamId]/record/

- `page.tsx` — RecordPage (~1450 tok)

## src/app/teams/[teamId]/settings/

- `page.tsx` — TeamSettingsPage (~1589 tok)

## src/app/teams/new/


## src/components/layout/


## src/components/recording/

- `RecordButton.tsx` — RecordButton (~1826 tok)

## src/components/summary/


## src/components/teams/


## src/components/ui/

- `ConfirmDialog.tsx` — ConfirmDialog (~337 tok)
- `Toast.tsx` — useToast (~328 tok)

## src/lib/ai/

- `summarize.ts` — Exports summarizeMeeting (~371 tok)
- `transcribe.ts` — Lazy: a missing OPENAI_API_KEY should fail inside the route's try/catch (clean JSON (~979 tok)

## src/lib/auth/


## src/lib/pdf/

- `render.ts` — Inline PDF renderer. @react-pdf/renderer is in next.config serverExternalPackages, (~960 tok)

## src/lib/supabase/

- `client.ts` — Exports createClient (~73 tok)
- `server.ts` — Exports createClient (~201 tok)

## src/lib/utils/


## src/trigger/

- `process-meeting.ts` — Worker-side pipeline. Runs on Trigger.dev (no request timeout), so any-length (~921 tok)

## src/trigger/process-meeting.ts


## src/types/

- `index.ts` — Exports GlobalRole, TeamRole, MeetingStatus, UserProfile + 7 more (~339 tok)

## supabase/migrations/

- `004_queued_status.sql` — Add 'queued' status: meeting rows are created queued by the upload route, (~94 tok)

## supabase/migrations/004_queued_status.sql


## trigger.config.ts


## src/lib/pdf/render.ts
Inline PDF render (createElement + @react-pdf/renderer). Replaces scripts/render-pdf.mjs spawn workaround — Vercel didn't bundle scripts/. ~120 tok
