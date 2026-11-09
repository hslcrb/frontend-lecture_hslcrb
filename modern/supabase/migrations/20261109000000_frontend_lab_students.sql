-- Run ONLY in a newly approved dedicated Supabase project for Frontend Lab.
create table if not exists public.frontend_lab_students (
  access_subject text primary key,
  email text not null,
  student_name text not null check (char_length(btrim(student_name)) between 2 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists frontend_lab_students_email_idx
  on public.frontend_lab_students (lower(email));
alter table public.frontend_lab_students enable row level security;
-- No anon or authenticated policy is defined: all operations happen server-side only.
revoke all on table public.frontend_lab_students from public, anon, authenticated;
grant select, insert, update, delete on table public.frontend_lab_students to service_role;

create schema if not exists frontend_lab_private;
create or replace function frontend_lab_private.set_updated_at()
returns trigger language plpgsql security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function frontend_lab_private.set_updated_at() from public, anon, authenticated;
drop trigger if exists frontend_lab_students_timestamp on public.frontend_lab_students;
create trigger frontend_lab_students_timestamp
before update on public.frontend_lab_students
for each row execute function frontend_lab_private.set_updated_at();
comment on table public.frontend_lab_students is
  'Private student names, keyed by Cloudflare Access JWT subject. Never read directly from browser.';
