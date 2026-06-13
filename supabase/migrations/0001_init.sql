-- Mealprep app schema
-- All translatable text columns are stored as JSONB with `de` and `en` keys.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: mirrors auth.users with app-level fields
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  preferred_language char(2) check (preferred_language in ('en', 'de')) default null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- weeks
-- ---------------------------------------------------------------------------
create table if not exists public.weeks (
  id uuid primary key default gen_random_uuid(),
  week_number int not null unique,
  theme_i18n jsonb not null,
  protein_base_i18n jsonb not null,
  carb_base_i18n jsonb not null,
  protein_g int not null,
  kcal int not null,
  budget_eur numeric(8, 2) not null
);

alter table public.weeks enable row level security;

drop policy if exists "weeks public read" on public.weeks;
create policy "weeks public read" on public.weeks
  for select using (true);

-- ---------------------------------------------------------------------------
-- week_ingredients
-- ---------------------------------------------------------------------------
create table if not exists public.week_ingredients (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  ingredient_name_i18n jsonb not null,
  amount_g int not null,
  category_i18n jsonb not null,
  protein_per_100g numeric(6, 2) not null default 0,
  kcal_per_100g numeric(6, 2) not null default 0,
  fat_per_100g numeric(6, 2) not null default 0,
  carbs_per_100g numeric(6, 2) not null default 0
);

create index if not exists week_ingredients_week_id_idx
  on public.week_ingredients (week_id);

alter table public.week_ingredients enable row level security;

drop policy if exists "week_ingredients public read" on public.week_ingredients;
create policy "week_ingredients public read" on public.week_ingredients
  for select using (true);

-- ---------------------------------------------------------------------------
-- sauces
-- ---------------------------------------------------------------------------
create table if not exists public.sauces (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  name_i18n jsonb not null,
  recipe jsonb not null,
  day_of_week smallint not null check (day_of_week between 0 and 6)
);

create index if not exists sauces_week_id_idx
  on public.sauces (week_id);

alter table public.sauces enable row level security;

drop policy if exists "sauces public read" on public.sauces;
create policy "sauces public read" on public.sauces
  for select using (true);

-- ---------------------------------------------------------------------------
-- shopping_lists
-- ---------------------------------------------------------------------------
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  store text not null check (store in ('denns', 'rewe')),
  items jsonb not null default '[]'::jsonb
);

create index if not exists shopping_lists_week_id_idx
  on public.shopping_lists (week_id);

alter table public.shopping_lists enable row level security;

drop policy if exists "shopping_lists public read" on public.shopping_lists;
create policy "shopping_lists public read" on public.shopping_lists
  for select using (true);

-- ---------------------------------------------------------------------------
-- user_progress
-- ---------------------------------------------------------------------------
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  day_offset smallint not null check (day_offset between 0 and 6),
  completed_ingredients jsonb not null default '{}'::jsonb,
  ist_quantities jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, week_id, day_offset)
);

create index if not exists user_progress_user_week_idx
  on public.user_progress (user_id, week_id);

alter table public.user_progress enable row level security;

drop policy if exists "user_progress self read" on public.user_progress;
create policy "user_progress self read" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "user_progress self write" on public.user_progress;
create policy "user_progress self write" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- helper: keep profiles in sync with auth.users
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
