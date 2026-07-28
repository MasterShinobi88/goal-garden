-- Goal Garden schema
-- Run this in the Supabase SQL editor after creating your project.

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  preferences jsonb not null default '{}'::jsonb,
  streak_count int not null default 0,
  last_active_date date,
  -- Premium ($7.99 one-time) follows the account across devices
  premium boolean not null default false,
  premium_source text,
  premium_activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists premium boolean not null default false;
alter table public.profiles add column if not exists premium_source text;
alter table public.profiles add column if not exists premium_activated_at timestamptz;

-- Goals
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If table already existed, add columns safely:
alter table public.goals add column if not exists category text not null default 'general';
alter table public.goals add column if not exists health_profile jsonb;
alter table public.goals add column if not exists health_plan jsonb;
alter table public.goals add column if not exists savings_profile jsonb;
alter table public.goals add column if not exists savings_plan jsonb;
alter table public.goals add column if not exists earning_profile jsonb;
alter table public.goals add column if not exists earning_plan jsonb;
alter table public.goals add column if not exists plant_type text;

create index if not exists goals_user_id_idx on public.goals(user_id);

-- Milestones (weekly)
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  target_date date not null,
  completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists milestones_goal_id_idx on public.milestones(goal_id);

-- Daily tasks (micro-tasks)
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

create index if not exists daily_tasks_milestone_id_idx on public.daily_tasks(milestone_id);
create index if not exists daily_tasks_scheduled_date_idx on public.daily_tasks(scheduled_date);

-- Journal entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  title text not null default 'Untitled',
  body text not null default '',
  mood text,
  tags jsonb not null default '[]'::jsonb,
  goal_id uuid references public.goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_id_idx on public.journal_entries(user_id);
create index if not exists journal_entries_entry_date_idx on public.journal_entries(entry_date);

alter table public.journal_entries enable row level security;

create policy "Users can view own journal"
  on public.journal_entries for select using (auth.uid() = user_id);
create policy "Users can insert own journal"
  on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own journal"
  on public.journal_entries for update using (auth.uid() = user_id);
create policy "Users can delete own journal"
  on public.journal_entries for delete using (auth.uid() = user_id);

-- Weekly reviews
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

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grants (required — otherwise clients get "permission denied for table …")
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.profiles to postgres, anon, authenticated, service_role;
grant all on table public.goals to postgres, anon, authenticated, service_role;
grant all on table public.milestones to postgres, anon, authenticated, service_role;
grant all on table public.daily_tasks to postgres, anon, authenticated, service_role;
grant all on table public.weekly_reviews to postgres, anon, authenticated, service_role;
grant all on table public.journal_entries to postgres, anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.weekly_reviews enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Goals policies
create policy "Users can view own goals"
  on public.goals for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own goals"
  on public.goals for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own goals"
  on public.goals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own goals"
  on public.goals for delete to authenticated using (auth.uid() = user_id);

-- Milestones: access via goal ownership
create policy "Users can view own milestones"
  on public.milestones for select
  using (exists (
    select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()
  ));
create policy "Users can insert own milestones"
  on public.milestones for insert
  with check (exists (
    select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()
  ));
create policy "Users can update own milestones"
  on public.milestones for update
  using (exists (
    select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()
  ));
create policy "Users can delete own milestones"
  on public.milestones for delete
  using (exists (
    select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()
  ));

-- Daily tasks: access via milestone -> goal ownership
create policy "Users can view own tasks"
  on public.daily_tasks for select
  using (exists (
    select 1 from public.milestones m
    join public.goals g on g.id = m.goal_id
    where m.id = milestone_id and g.user_id = auth.uid()
  ));
create policy "Users can insert own tasks"
  on public.daily_tasks for insert
  with check (exists (
    select 1 from public.milestones m
    join public.goals g on g.id = m.goal_id
    where m.id = milestone_id and g.user_id = auth.uid()
  ));
create policy "Users can update own tasks"
  on public.daily_tasks for update
  using (exists (
    select 1 from public.milestones m
    join public.goals g on g.id = m.goal_id
    where m.id = milestone_id and g.user_id = auth.uid()
  ));
create policy "Users can delete own tasks"
  on public.daily_tasks for delete
  using (exists (
    select 1 from public.milestones m
    join public.goals g on g.id = m.goal_id
    where m.id = milestone_id and g.user_id = auth.uid()
  ));

-- Weekly reviews
create policy "Users can view own reviews"
  on public.weekly_reviews for select using (auth.uid() = user_id);
create policy "Users can insert own reviews"
  on public.weekly_reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews"
  on public.weekly_reviews for update using (auth.uid() = user_id);
