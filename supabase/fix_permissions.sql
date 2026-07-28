-- Goal Garden — fix "permission denied for table goals"
-- Run this in Supabase → SQL Editor → New query → Run
-- Safe to re-run (drops/recreates policies).

-- ---------------------------------------------------------------------------
-- 1) Schema usage + table grants (this is what "permission denied for table" means)
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on table public.profiles to postgres, anon, authenticated, service_role;
grant all on table public.goals to postgres, anon, authenticated, service_role;
grant all on table public.milestones to postgres, anon, authenticated, service_role;
grant all on table public.daily_tasks to postgres, anon, authenticated, service_role;
grant all on table public.weekly_reviews to postgres, anon, authenticated, service_role;

-- journal if present
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'journal_entries'
  ) then
    execute 'grant all on table public.journal_entries to postgres, anon, authenticated, service_role';
  end if;
end $$;

-- sequences (if any serial ids exist)
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) Ensure tables exist (no-op if already created)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  preferences jsonb not null default '{}'::jsonb,
  streak_count int not null default 0,
  last_active_date date,
  premium boolean not null default false,
  premium_source text,
  premium_activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  deadline date not null,
  success_metrics text,
  archived boolean not null default false,
  category text not null default 'general',
  health_profile jsonb,
  health_plan jsonb,
  savings_profile jsonb,
  savings_plan jsonb,
  earning_profile jsonb,
  earning_plan jsonb,
  plant_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals add column if not exists category text not null default 'general';
alter table public.goals add column if not exists health_profile jsonb;
alter table public.goals add column if not exists health_plan jsonb;
alter table public.goals add column if not exists savings_profile jsonb;
alter table public.goals add column if not exists savings_plan jsonb;
alter table public.goals add column if not exists earning_profile jsonb;
alter table public.goals add column if not exists earning_plan jsonb;
alter table public.goals add column if not exists plant_type text;

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  target_date date not null,
  completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  title text not null,
  scheduled_date date not null,
  completed boolean not null default false,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  completed_count int not null default 0,
  missed_count int not null default 0,
  reflection_notes text,
  suggestions text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ---------------------------------------------------------------------------
-- 3) Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.weekly_reviews enable row level security;

-- ---------------------------------------------------------------------------
-- 4) Drop old policies (names from schema.sql) then recreate
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

drop policy if exists "Users can view own goals" on public.goals;
drop policy if exists "Users can insert own goals" on public.goals;
drop policy if exists "Users can update own goals" on public.goals;
drop policy if exists "Users can delete own goals" on public.goals;

drop policy if exists "Users can view own milestones" on public.milestones;
drop policy if exists "Users can insert own milestones" on public.milestones;
drop policy if exists "Users can update own milestones" on public.milestones;
drop policy if exists "Users can delete own milestones" on public.milestones;

drop policy if exists "Users can view own tasks" on public.daily_tasks;
drop policy if exists "Users can insert own tasks" on public.daily_tasks;
drop policy if exists "Users can update own tasks" on public.daily_tasks;
drop policy if exists "Users can delete own tasks" on public.daily_tasks;

drop policy if exists "Users can view own reviews" on public.weekly_reviews;
drop policy if exists "Users can insert own reviews" on public.weekly_reviews;
drop policy if exists "Users can update own reviews" on public.weekly_reviews;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Goals
create policy "Users can view own goals"
  on public.goals for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  to authenticated
  using (auth.uid() = user_id);

-- Milestones (via owning goal)
create policy "Users can view own milestones"
  on public.milestones for select
  to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));

create policy "Users can insert own milestones"
  on public.milestones for insert
  to authenticated
  with check (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));

create policy "Users can update own milestones"
  on public.milestones for update
  to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));

create policy "Users can delete own milestones"
  on public.milestones for delete
  to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));

-- Daily tasks (via milestone → goal)
create policy "Users can view own tasks"
  on public.daily_tasks for select
  to authenticated
  using (exists (
    select 1 from public.milestones m
    join public.goals g on g.id = m.goal_id
    where m.id = milestone_id and g.user_id = auth.uid()
  ));

create policy "Users can insert own tasks"
  on public.daily_tasks for insert
  to authenticated
  with check (exists (
    select 1 from public.milestones m
    join public.goals g on g.id = m.goal_id
    where m.id = milestone_id and g.user_id = auth.uid()
  ));

create policy "Users can update own tasks"
  on public.daily_tasks for update
  to authenticated
  using (exists (
    select 1 from public.milestones m
    join public.goals g on g.id = m.goal_id
    where m.id = milestone_id and g.user_id = auth.uid()
  ));

create policy "Users can delete own tasks"
  on public.daily_tasks for delete
  to authenticated
  using (exists (
    select 1 from public.milestones m
    join public.goals g on g.id = m.goal_id
    where m.id = milestone_id and g.user_id = auth.uid()
  ));

-- Weekly reviews
create policy "Users can view own reviews"
  on public.weekly_reviews for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own reviews"
  on public.weekly_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.weekly_reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5) Auto-create profile on signup (needed for preferences sync)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for existing users missing a row
insert into public.profiles (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Done. Test: sign in on the site → Settings → Upload this device now.
