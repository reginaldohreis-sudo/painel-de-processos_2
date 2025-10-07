/*
          # [Initial Schema Setup]
          Cria todas as tabelas, tipos e políticas de segurança iniciais para o painel de produção.

          ## Query Description: [Este script estabelece a fundação do banco de dados. Ele cria tabelas para usuários (profiles), produtos, bicos, funcionários e os dois tipos de lotes (asperção e ajustagem). Também configura a segurança de nível de linha (RLS) para proteger os dados, garantindo que usuários autenticados possam ler os dados e apenas administradores possam modificar.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Tables Created: profiles, employees, nozzles, products, batches, adjustment_batches
          - Types Created: product_type, batch_status
          - Functions Created: get_user_role, handle_new_user
          - Triggers Created: on_auth_user_created
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [A maioria das operações de escrita requer um perfil de 'admin'.]
          
          ## Performance Impact:
          - Indexes: [Primary keys são indexados automaticamente.]
          - Triggers: [Um trigger é adicionado para criar um perfil de usuário automaticamente.]
          - Estimated Impact: [Baixo impacto inicial. O desempenho dependerá do volume de dados futuro.]
          */

-- Helper function to get user role from JWT
create or replace function public.get_user_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return (select raw_user_meta_data->>'role' from auth.users where id = auth.uid())::text;
end;
$$;

-- PROFILES table
-- Stores public-facing user data.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user'
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$;

-- Trigger to call the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- EMPLOYEES table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hours_per_day NUMERIC NOT NULL,
    working_days INT[] NOT NULL -- Array of integers (0-6 for Sun-Sat)
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users to read." ON public.employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin users to manage employees." ON public.employees FOR ALL USING (get_user_role() = 'admin');

-- NOZZLES table
CREATE TABLE public.nozzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    flow_rate NUMERIC NOT NULL -- in g/s
);
ALTER TABLE public.nozzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users to read." ON public.nozzles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin users to manage nozzles." ON public.nozzles FOR ALL USING (get_user_role() = 'admin');

-- PRODUCTS table
CREATE TYPE product_type AS ENUM ('aspercao', 'ajustagem');
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    production_time NUMERIC NOT NULL, -- in minutes
    type product_type NOT NULL
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users to read." ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin users to manage products." ON public.products FOR ALL USING (get_user_role() = 'admin');

-- BATCHES table (Asperção)
CREATE TYPE batch_status AS ENUM ('Planejado', 'Em Produção', 'Concluído', 'Atrasado');
CREATE TABLE public.batches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    products JSONB NOT NULL,
    progress NUMERIC DEFAULT 0,
    status batch_status DEFAULT 'Planejado',
    start_date TIMESTAMPTZ NOT NULL,
    delivery_date TIMESTAMPTZ NOT NULL,
    real_production_time NUMERIC,
    real_input_kg NUMERIC,
    nozzle_id UUID REFERENCES public.nozzles(id)
);
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users to read." ON public.batches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin users to manage batches." ON public.batches FOR ALL USING (get_user_role() = 'admin');

-- ADJUSTMENT_BATCHES table
CREATE TABLE public.adjustment_batches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id),
    assignments JSONB NOT NULL,
    planned_time NUMERIC,
    real_time NUMERIC,
    status batch_status DEFAULT 'Planejado',
    start_date TIMESTAMPTZ NOT NULL,
    delivery_date TIMESTAMPTZ NOT NULL,
    progress NUMERIC DEFAULT 0
);
ALTER TABLE public.adjustment_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users to read." ON public.adjustment_batches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin users to manage adjustment batches." ON public.adjustment_batches FOR ALL USING (get_user_role() = 'admin');
