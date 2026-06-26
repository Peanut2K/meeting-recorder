-- Per-team editable base prompt for the summarizer (null = use the app default).
alter table public.team_templates add column if not exists prompt text;
