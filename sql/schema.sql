-- ============================================================================
-- Nutrición Manager — esquema completo (tablas, funciones, triggers, RLS)
-- Ejecutar una sola vez en el SQL Editor de tu proyecto Supabase.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tablas
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'cliente' check (role in ('admin', 'cliente')),
  full_name text,
  objetivo text,
  restricciones text,
  altura_cm integer,
  notas text,
  created_at timestamptz not null default now()
);

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  kcal_100g numeric(8, 2) not null default 0,
  proteina_100g numeric(8, 2) not null default 0,
  carbos_100g numeric(8, 2) not null default 0,
  grasas_100g numeric(8, 2) not null default 0,
  fuente text not null default 'manual' check (fuente in ('manual', 'ia')),
  created_at timestamptz not null default now()
);

create table if not exists public.tip_categories (
  id uuid primary key default gen_random_uuid(),
  titulo text not null unique,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.tip_categories (id) on delete cascade,
  emoji text,
  titulo text not null,
  contenido text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tips add column if not exists category_id uuid references public.tip_categories (id) on delete cascade;

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  comidas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  admin_id uuid references public.profiles (id),
  request_id uuid,
  source text not null default 'manual' check (source in ('ia', 'manual'))
);

alter table public.nutrition_plans add column if not exists admin_id uuid references public.profiles (id);
alter table public.nutrition_plans add column if not exists request_id uuid;
alter table public.nutrition_plans add column if not exists source text not null default 'manual';
do $$
begin
  alter table public.nutrition_plans add constraint nutrition_plans_source_check check (source in ('ia', 'manual'));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  fecha date not null default current_date,
  peso_kg numeric(6, 2),
  grasa_pct numeric(5, 2),
  medidas jsonb,
  notas text,
  created_at timestamptz not null default now(),
  -- Composición corporal tipo InBody (opcional, se llena cuando hay báscula de bioimpedancia)
  masa_muscular_kg numeric(6, 2),
  masa_grasa_kg numeric(6, 2),
  grasa_visceral numeric(5, 2),
  agua_corporal_l numeric(6, 2),
  tasa_metabolica_kcal integer
);

alter table public.progress_logs add column if not exists masa_muscular_kg numeric(6, 2);
alter table public.progress_logs add column if not exists masa_grasa_kg numeric(6, 2);
alter table public.progress_logs add column if not exists grasa_visceral numeric(5, 2);
alter table public.progress_logs add column if not exists agua_corporal_l numeric(6, 2);
alter table public.progress_logs add column if not exists tasa_metabolica_kcal integer;

create table if not exists public.nutrition_plan_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  objetivo text not null,
  restricciones text,
  comidas_dia integer,
  notas text,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completado')),
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.nutrition_plans add constraint nutrition_plans_request_id_fkey
    foreign key (request_id) references public.nutrition_plan_requests (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.training_plan_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  objetivo text not null,
  nivel text,
  lesiones text,
  sesiones_semana integer,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completado')),
  created_at timestamptz not null default now()
);

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid references public.profiles (id),
  request_id uuid references public.training_plan_requests (id) on delete set null,
  title text not null,
  contenido jsonb not null,
  source text not null default 'manual' check (source in ('ia', 'manual')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Helper: rol del usuario autenticado (security definer evita recursión de RLS)
-- ----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ----------------------------------------------------------------------------
-- Trigger: crear el profile automáticamente al registrarse en auth.users
-- No hay auto-registro público: solo el admin crea cuentas de cliente desde
-- /admin/clientes (usa la service_role key), pasando role='cliente' en el
-- user_metadata.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'cliente'),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.foods enable row level security;
alter table public.tips enable row level security;
alter table public.tip_categories enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.progress_logs enable row level security;
alter table public.training_plan_requests enable row level security;
alter table public.training_plans enable row level security;
alter table public.nutrition_plan_requests enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- foods (catálogo, solo admin) --------------------------------------------
drop policy if exists "foods_all_admin" on public.foods;
create policy "foods_all_admin" on public.foods
  for all using (public.is_admin()) with check (public.is_admin());

-- tips (lectura para cualquier usuario logueado, escritura solo admin) --------
drop policy if exists "tips_select_authenticated" on public.tips;
create policy "tips_select_authenticated" on public.tips
  for select using (auth.uid() is not null);

drop policy if exists "tips_write_admin" on public.tips;
create policy "tips_write_admin" on public.tips
  for all using (public.is_admin()) with check (public.is_admin());

-- tip_categories (lectura para cualquier usuario logueado, escritura solo admin) --
drop policy if exists "tip_categories_select_authenticated" on public.tip_categories;
create policy "tip_categories_select_authenticated" on public.tip_categories
  for select using (auth.uid() is not null);

drop policy if exists "tip_categories_write_admin" on public.tip_categories;
create policy "tip_categories_write_admin" on public.tip_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- nutrition_plans -----------------------------------------------------------
drop policy if exists "plans_select_own_or_admin" on public.nutrition_plans;
create policy "plans_select_own_or_admin" on public.nutrition_plans
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "plans_write_admin" on public.nutrition_plans;
create policy "plans_write_admin" on public.nutrition_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- progress_logs ---------------------------------------------------------------
drop policy if exists "progress_select_own_or_admin" on public.progress_logs;
create policy "progress_select_own_or_admin" on public.progress_logs
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "progress_write_admin" on public.progress_logs;
create policy "progress_write_admin" on public.progress_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- training_plan_requests -----------------------------------------------------
drop policy if exists "training_requests_select_own_or_admin" on public.training_plan_requests;
create policy "training_requests_select_own_or_admin" on public.training_plan_requests
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "training_requests_insert_own" on public.training_plan_requests;
create policy "training_requests_insert_own" on public.training_plan_requests
  for insert with check (client_id = auth.uid());

drop policy if exists "training_requests_update_admin" on public.training_plan_requests;
create policy "training_requests_update_admin" on public.training_plan_requests
  for update using (public.is_admin());

drop policy if exists "training_requests_delete_admin" on public.training_plan_requests;
create policy "training_requests_delete_admin" on public.training_plan_requests
  for delete using (public.is_admin());

-- training_plans ---------------------------------------------------------------
drop policy if exists "training_plans_select_own_or_admin" on public.training_plans;
create policy "training_plans_select_own_or_admin" on public.training_plans
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "training_plans_write_admin" on public.training_plans;
create policy "training_plans_write_admin" on public.training_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- nutrition_plan_requests ------------------------------------------------------
drop policy if exists "nutrition_requests_select_own_or_admin" on public.nutrition_plan_requests;
create policy "nutrition_requests_select_own_or_admin" on public.nutrition_plan_requests
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "nutrition_requests_insert_own" on public.nutrition_plan_requests;
create policy "nutrition_requests_insert_own" on public.nutrition_plan_requests
  for insert with check (client_id = auth.uid());

drop policy if exists "nutrition_requests_update_admin" on public.nutrition_plan_requests;
create policy "nutrition_requests_update_admin" on public.nutrition_plan_requests
  for update using (public.is_admin());

drop policy if exists "nutrition_requests_delete_admin" on public.nutrition_plan_requests;
create policy "nutrition_requests_delete_admin" on public.nutrition_plan_requests
  for delete using (public.is_admin());
