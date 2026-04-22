-- =============================================
-- Games Delivery Tracker — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================

-- 1. Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  role text not null default 'PM' check (role in ('admin', 'PM', 'Client')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Everyone can read profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Admin can insert profiles (via edge function)
create policy "Service role can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (true);

-- 2. Spaces (projects like HKMU, SFU)
create table if not exists public.spaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text not null default '#0f62fe',
  created_at timestamptz default now()
);

alter table public.spaces enable row level security;
create policy "Spaces readable by authenticated" on public.spaces for select to authenticated using (true);
create policy "Spaces insertable by authenticated" on public.spaces for insert to authenticated with check (true);
create policy "Spaces updatable by authenticated" on public.spaces for update to authenticated using (true);

-- 3. Folders (games within a project)
create table if not exists public.folders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  space_id uuid references public.spaces(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.folders enable row level security;
create policy "Folders readable by authenticated" on public.folders for select to authenticated using (true);
create policy "Folders insertable by authenticated" on public.folders for insert to authenticated with check (true);
create policy "Folders updatable by authenticated" on public.folders for update to authenticated using (true);

-- 4. Tasks (milestones)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  space_id uuid references public.spaces(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete cascade not null,
  assignee text not null default 'PM',
  status text not null default 'todo' check (status in ('todo', 'in-progress', 'review', 'done')),
  due_date date not null,
  start_date date,
  phase text not null default 'dev' check (phase in ('dev', 'delivery', 'post', 'launch')),
  duration text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;
create policy "Tasks readable by authenticated" on public.tasks for select to authenticated using (true);
create policy "Tasks insertable by authenticated" on public.tasks for insert to authenticated with check (true);
create policy "Tasks updatable by authenticated" on public.tasks for update to authenticated using (true);
create policy "Tasks deletable by authenticated" on public.tasks for delete to authenticated using (true);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function update_updated_at();

-- 5. Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'PM')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
