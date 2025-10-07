-- Criar a tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    production_time real NOT NULL,
    type text NOT NULL CHECK (type IN ('aspercao', 'ajustagem')),
    created_at timestamptz DEFAULT now()
);
-- Criar a tabela de bicos
CREATE TABLE IF NOT EXISTS public.nozzles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    flow_rate real NOT NULL,
    created_at timestamptz DEFAULT now()
);
-- Criar a tabela de funcionários
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    hours_per_day real NOT NULL,
    working_days integer[] NOT NULL, -- Array de inteiros (0-6 para Dom-Sáb)
    created_at timestamptz DEFAULT now()
);
-- Criar a tabela de lotes de Asperção
CREATE TABLE IF NOT EXISTS public.batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    nozzle_id uuid REFERENCES public.nozzles(id),
    start_date timestamptz NOT NULL,
    delivery_date timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'Planejado',
    progress numeric NOT NULL DEFAULT 0,
    real_production_time real DEFAULT 0,
    real_input_kg real DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
-- Tabela intermediária para produtos em um lote de Asperção
CREATE TABLE IF NOT EXISTS public.batch_products (
    id serial PRIMARY KEY,
    batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE
);
-- Tabela de atribuições para cada produto em um lote de Asperção
CREATE TABLE IF NOT EXISTS public.batch_assignments (
    id serial PRIMARY KEY,
    batch_product_id integer NOT NULL REFERENCES public.batch_products(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    quantity integer NOT NULL,
    real_quantity integer DEFAULT 0
);
-- Criar a tabela de lotes de Ajustagem
CREATE TABLE IF NOT EXISTS public.adjustment_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    product_id uuid NOT NULL REFERENCES public.products(id),
    planned_time real NOT NULL,
    real_time real DEFAULT 0,
    status text NOT NULL DEFAULT 'Planejado',
    start_date timestamptz NOT NULL,
    delivery_date timestamptz NOT NULL,
    progress numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
-- Tabela de atribuições para lotes de Ajustagem
CREATE TABLE IF NOT EXISTS public.adjustment_assignments (
    id serial PRIMARY KEY,
    adjustment_batch_id uuid NOT NULL REFERENCES public.adjustment_batches(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    quantity integer NOT NULL,
    real_quantity integer DEFAULT 0
);
-- Políticas de Segurança (RLS)
-- Habilitar RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nozzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_assignments ENABLE ROW LEVEL SECURITY;
-- Políticas para a tabela de perfis
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Políticas para as outras tabelas (permite acesso total a usuários autenticados)
-- Produtos
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.products;
CREATE POLICY "Allow all access to authenticated users" ON public.products FOR ALL USING (auth.role() = 'authenticated');
-- Bicos
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.nozzles;
CREATE POLICY "Allow all access to authenticated users" ON public.nozzles FOR ALL USING (auth.role() = 'authenticated');
-- Funcionários
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.employees;
CREATE POLICY "Allow all access to authenticated users" ON public.employees FOR ALL USING (auth.role() = 'authenticated');
-- Lotes de Asperção
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.batches;
CREATE POLICY "Allow all access to authenticated users" ON public.batches FOR ALL USING (auth.role() = 'authenticated');
-- Produtos do Lote
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.batch_products;
CREATE POLICY "Allow all access to authenticated users" ON public.batch_products FOR ALL USING (auth.role() = 'authenticated');
-- Atribuições do Lote
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.batch_assignments;
CREATE POLICY "Allow all access to authenticated users" ON public.batch_assignments FOR ALL USING (auth.role() = 'authenticated');
-- Lotes de Ajustagem
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.adjustment_batches;
CREATE POLICY "Allow all access to authenticated users" ON public.adjustment_batches FOR ALL USING (auth.role() = 'authenticated');
-- Atribuições de Ajustagem
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.adjustment_assignments;
CREATE POLICY "Allow all access to authenticated users" ON public.adjustment_assignments FOR ALL USING (auth.role() = 'authenticated');
