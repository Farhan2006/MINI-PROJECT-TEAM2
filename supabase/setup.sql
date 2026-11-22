-- Run once in Supabase -> SQL Editor. Safe to re-run.
-- Tables are locked (RLS on, no policies): only the server code using the service_role key can touch them.
create table if not exists public.site_content (
  id int primary key check (id = 1),          -- one row: the whole site as JSON (window.SITE)
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.site_history (  -- every save, newest first, for "restore previous version"
  id bigint generated always as identity primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
alter table public.site_history enable row level security;

-- Public bucket for photos, videos and datasheets (anyone can view a file URL; uploads go through the server only).
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)       -- 50 MB per file (the free-plan maximum)
on conflict (id) do update set public = true, file_size_limit = 52428800;
