# Meeting Recorder — Setup Guide

A Next.js app that records team meetings, transcribes the audio (OpenAI Whisper),
and generates a structured summary (Claude) — topics, decisions, and action items —
that can be edited and exported to PDF. Auth, storage, and data live in Supabase.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4 |
| Auth / DB / Storage | Supabase (Postgres + RLS + Storage) |
| Transcription | OpenAI Whisper (`whisper-1`) |
| Summarization | Anthropic Claude (`claude-sonnet-4-6`) |
| PDF export | `@react-pdf/renderer` |

## Prerequisites

- **Node.js 20+** and npm
- A **Supabase** project — https://supabase.com
- An **OpenAI** API key (for Whisper transcription) — https://platform.openai.com
- An **Anthropic** API key (for Claude summaries) — https://console.anthropic.com

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Follow `README_SUPABASE.md` step by step. In short:

1. **Run the schema** — paste `supabase/migrations/001_initial_schema.sql` into the
   Supabase **SQL Editor** and run it. This creates the 6 tables
   (`users`, `teams`, `team_members`, `meetings`, `summaries`, `team_templates`)
   with Row Level Security enabled.
2. **Create the storage bucket** — Storage → **New bucket** named `meeting-audio`,
   **not** public.
3. **Add the storage policy** — run the `audio_team_member` policy SQL
   (included at the bottom of the migration file).

Verify against the checklist in `README_SUPABASE.md`: 6 tables visible, RLS enabled
on each, `meeting-audio` bucket exists, storage policy present.

### 3. Set environment variables

Create `.env.local` in the project root:

```env
# Supabase — Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# OpenAI — used for Whisper transcription
OPENAI_API_KEY=<your-openai-key>

# Anthropic — used for Claude meeting summaries
ANTHROPIC_API_KEY=<your-anthropic-key>
```

> The **service-role key** is secret and bypasses RLS — never expose it to the
> client. It is used server-side by `POST /api/teams` to insert the initial admin
> member row.

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## How it works (the recording flow)

1. **Register / log in** (`/register`, `/login`) — Supabase Auth.
2. **Create a team** (`/teams/new`) — you become its admin. Optionally configure
   extra summary fields under team **Settings** (`team_templates`).
3. **Record a meeting** (`/teams/[teamId]/record`) — captures audio in the browser
   via the `RecordButton` component.
4. **Upload** — `POST /api/meetings/upload` stores the audio in the
   `meeting-audio` bucket and creates a `meetings` row.
5. **Process** — `src/lib/ai/transcribe.ts` transcribes with Whisper, then
   `src/lib/ai/summarize.ts` asks Claude for structured JSON
   (topics / decisions / action items / custom fields).
6. **Review & export** (`/meetings/[meetingId]`) — edit the summary
   (`SummaryEditor`), view the transcript, and export to PDF (`ExportButtons` →
   `src/lib/pdf/MeetingPdf.tsx`).

## Build for production

```bash
npm run build
npm run start
```

## Troubleshooting

- **Team creation fails / RLS error** — confirm `SUPABASE_SERVICE_ROLE_KEY` is set;
  the create-team route needs it to bypass RLS.
- **Transcription/summary errors** — verify `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`
  are valid and have quota.
- **Audio upload fails** — confirm the `meeting-audio` bucket exists and the
  `audio_team_member` storage policy was applied.
- **Auth/session issues** — check the two `NEXT_PUBLIC_SUPABASE_*` values match your
  project under Settings → API.
