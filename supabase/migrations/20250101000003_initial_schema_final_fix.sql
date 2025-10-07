-- Habilitar a extensão pgcrypto se ainda não estiver habilitada
create extension if not exists "pgcrypto" with schema "extensions";
-- Tabela de Produtos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  production_time real not null,
  type text not null check (type in ('aspercao', 'ajustagem')),
  created_at timestamptz default now()
);
-- Tabela de Funcionários
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hours_per_day real not null,
  working_days integer[] not null,
  created_at timestamptz default now()
);
-- Tabela de Bicos
create table if not exists public.nozzles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  flow_rate real not null,
  created_at timestamptz default now()
);
-- Tabela de Lotes de Asperção
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nozzle_id uuid not null references public.nozzles(id),
  start_date timestamptz not null,
  delivery_date timestamptz not null,
  status text not null,
  progress real not null,
  real_production_time real,
  real_input_kg real,
  created_at timestamptz default now()
);
-- Tabela de Produtos por Lote (Asperção)
create table if not exists public.batch_products (
  id serial primary key,
  batch_id uuid not null references public.batches(id) on delete cascade,
  product_id uuid not null references public.products(id)
);
-- Tabela de Atribuições por Produto de Lote (Asperção)
create table if not exists public.batch_assignments (
  id serial primary key,
  batch_product_id integer not null references public.batch_products(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  quantity integer not null,
  real_quantity integer default 0
);
-- Tabela de Lotes de Ajustagem
create table if not exists public.adjustment_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_id uuid not null references public.products(id),
  planned_time real not null,
  real_time real,
  status text not null,
  start_date timestamptz not null,
  delivery_date timestamptz not null,
  progress real not null,
  created_at timestamptz default now()
);
-- Tabela de Atribuições por Lote de Ajustagem
create table if not exists public.adjustment_assignments (
  id serial primary key,
  adjustment_batch_id uuid not null references public.adjustment_batches(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  quantity integer not null,
  real_quantity integer default 0
);
-- Habilitar RLS para todas as tabelas
alter table public.products enable row level security;
alter table public.employees enable row level security;
alter table public.nozzles enable row level security;
alter table public.batches enable row level security;
alter table public.batch_products enable row level security;
alter table public.batch_assignments enable row level security;
alter table public.adjustment_batches enable row level security;
alter table public.adjustment_assignments enable row level security;
-- Políticas de Acesso (permitir acesso a todos os usuários autenticados)
drop policy if exists "Allow all access to authenticated users" on public.products;
create policy "Allow all access to authenticated users" on public.products for all to authenticated using (true);
drop policy if exists "Allow all access to authenticated users" on public.employees;
create policy "Allow all access to authenticated users" on public.employees for all to authenticated using (true);
drop policy if exists "Allow all access to authenticated users" on public.nozzles;
create policy "Allow all access to authenticated users" on public.nozzles for all to authenticated using (true);
drop policy if exists "Allow all access to authenticated users" on public.batches;
create policy "Allow all access to authenticated users" on public.batches for all to authenticated using (true);
drop policy if exists "Allow all access to authenticated users" on public.batch_products;
create policy "Allow all access to authenticated users" on public.batch_products for all to authenticated using (true);
drop policy if exists "Allow all access to authenticated users" on public.batch_assignments;
create policy "Allow all access to authenticated users" on public.batch_assignments for all to authenticated using (true);
drop policy if exists "Allow all access to authenticated users" on public.adjustment_batches;
create policy "Allow all access to authenticated users" on public.adjustment_batches for all to authenticated using (true);
drop policy if exists "Allow all access to authenticated users" on public.adjustment_assignments;
create policy "Allow all access to authenticated users" on public.adjustment_assignments for all to authenticated using (true);
