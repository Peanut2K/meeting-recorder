-- Add 'queued' status: meeting rows are created queued by the upload route,
-- then the Trigger.dev worker moves them processing -> done/failed.
alter table public.meetings drop constraint if exists meetings_status_check;
alter table public.meetings add constraint meetings_status_check
  check (status in ('queued', 'processing', 'done', 'failed'));
