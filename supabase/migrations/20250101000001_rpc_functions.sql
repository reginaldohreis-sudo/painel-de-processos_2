-- Habilitar a extensão pgcrypto se ainda não estiver habilitada
create extension if not exists "pgcrypto" with schema "extensions";

-- Função para criar ou atualizar um lote de Asperção
create or replace function public.create_or_update_batch(payload jsonb)
returns void
language plpgsql
security definer
as $$
declare
  batch_id_val uuid;
  product_item jsonb;
  assignment_item jsonb;
  batch_product_id_val int;
begin
  -- Se um ID é fornecido, é uma edição. Excluímos os registros antigos para recriá-los.
  if payload ? 'id' and payload->>'id' is not null and payload->>'id' != '' then
    batch_id_val := (payload->>'id')::uuid;
    -- Excluir atribuições e produtos de lote existentes para este lote
    delete from public.batch_assignments where batch_product_id in (select id from public.batch_products where batch_id = batch_id_val);
    delete from public.batch_products where batch_id = batch_id_val;
  else
    -- Se não há ID, é um novo lote. Geramos um novo UUID.
    batch_id_val := gen_random_uuid();
  end if;

  -- Inserir ou atualizar o lote principal
  insert into public.batches (id, name, nozzle_id, start_date, delivery_date, status, progress, real_production_time, real_input_kg)
  values (
    batch_id_val,
    payload->>'name',
    (payload->>'nozzleId')::uuid,
    (payload->>'startDate')::timestamptz,
    (payload->>'deliveryDate')::timestamptz,
    (payload->>'status')::text,
    (payload->>'progress')::numeric,
    (payload->>'realProductionTime')::numeric,
    (payload->>'realInputKg')::numeric
  )
  on conflict (id) do update set
    name = excluded.name,
    nozzle_id = excluded.nozzle_id,
    start_date = excluded.start_date,
    delivery_date = excluded.delivery_date,
    status = excluded.status;

  -- Inserir produtos e suas atribuições
  for product_item in select * from jsonb_array_elements(payload->'products')
  loop
    insert into public.batch_products (batch_id, product_id)
    values (batch_id_val, (product_item->>'productId')::uuid)
    returning id into batch_product_id_val;

    for assignment_item in select * from jsonb_array_elements(product_item->'assignments')
    loop
      insert into public.batch_assignments (batch_product_id, employee_id, quantity, real_quantity)
      values (
        batch_product_id_val,
        (assignment_item->>'employeeId')::uuid,
        (assignment_item->>'quantity')::int,
        (assignment_item->>'realQuantity')::int
      );
    end loop;
  end loop;
end;
$$;

-- Função para atualizar dados reais de um lote de Asperção
create or replace function public.update_batch_real_data(b_id uuid, payload jsonb)
returns void
language plpgsql
security definer
as $$
declare
  product_item jsonb;
  assignment_item jsonb;
  bp_id int;
  total_planned int;
  total_real int;
  current_progress numeric;
begin
  -- Atualizar as atribuições primeiro
  for product_item in select * from jsonb_array_elements(payload->'products')
  loop
    select id into bp_id from public.batch_products where batch_id = b_id and product_id = (product_item->>'productId')::uuid;
    for assignment_item in select * from jsonb_array_elements(product_item->'assignments')
    loop
        update public.batch_assignments
        set real_quantity = (assignment_item->>'realQuantity')::int
        where batch_product_id = bp_id and employee_id = (assignment_item->>'employeeId')::uuid;
    end loop;
  end loop;

  -- Recalcular progresso
  select sum(a.quantity), sum(a.real_quantity)
  into total_planned, total_real
  from public.batch_products bp
  join public.batch_assignments a on a.batch_product_id = bp.id
  where bp.batch_id = b_id;

  if total_planned > 0 then
    current_progress := round((total_real::numeric / total_planned::numeric) * 100);
  else
    current_progress := 0;
  end if;

  -- Atualizar o lote principal com progresso e status recalculados
  update public.batches
  set
    real_production_time = (payload->>'realProductionTime')::numeric,
    real_input_kg = (payload->>'realInputKg')::numeric,
    progress = current_progress,
    status = case
        when current_progress >= 100 then 'Concluído'
        when (select delivery_date from public.batches where id = b_id) < now() and current_progress < 100 then 'Atrasado'
        when total_real > 0 then 'Em Produção'
        else 'Planejado'
    end
  where id = b_id;
end;
$$;

-- Função para criar ou atualizar um lote de Ajustagem
create or replace function public.create_or_update_adjustment_batch(payload jsonb)
returns void
language plpgsql
security definer
as $$
declare
  batch_id_val uuid;
  assignment_item jsonb;
begin
  if payload ? 'id' and payload->>'id' is not null and payload->>'id' != '' then
    batch_id_val := (payload->>'id')::uuid;
    delete from public.adjustment_assignments where adjustment_batch_id = batch_id_val;
  else
    batch_id_val := gen_random_uuid();
  end if;

  insert into public.adjustment_batches (id, name, product_id, start_date, delivery_date, status, progress, planned_time, real_time)
  values (
    batch_id_val,
    payload->>'name',
    (payload->>'productId')::uuid,
    (payload->>'startDate')::timestamptz,
    (payload->>'deliveryDate')::timestamptz,
    (payload->>'status')::text,
    (payload->>'progress')::numeric,
    (payload->>'plannedTime')::numeric,
    (payload->>'realTime')::numeric
  )
  on conflict (id) do update set
    name = excluded.name,
    product_id = excluded.product_id,
    start_date = excluded.start_date,
    delivery_date = excluded.delivery_date,
    status = excluded.status,
    planned_time = excluded.planned_time;

  for assignment_item in select * from jsonb_array_elements(payload->'assignments')
  loop
    insert into public.adjustment_assignments (adjustment_batch_id, employee_id, quantity, real_quantity)
    values (
      batch_id_val,
      (assignment_item->>'employeeId')::uuid,
      (assignment_item->>'quantity')::int,
      (assignment_item->>'realQuantity')::int
    );
  end loop;
end;
$$;

-- Função para atualizar dados reais de um lote de Ajustagem
create or replace function public.update_adjustment_batch_real_data(b_id uuid, payload jsonb)
returns void
language plpgsql
security definer
as $$
declare
  assignment_item jsonb;
  total_planned int;
  total_real int;
  current_progress numeric;
begin
  -- Atualizar as atribuições
  for assignment_item in select * from jsonb_array_elements(payload->'assignments')
  loop
      update public.adjustment_assignments
      set real_quantity = (assignment_item->>'realQuantity')::int
      where adjustment_batch_id = b_id and employee_id = (assignment_item->>'employeeId')::uuid;
  end loop;

  -- Recalcular progresso
  select sum(quantity), sum(real_quantity)
  into total_planned, total_real
  from public.adjustment_assignments
  where adjustment_batch_id = b_id;

  if total_planned > 0 then
    current_progress := round((total_real::numeric / total_planned::numeric) * 100);
  else
    current_progress := 0;
  end if;

  -- Atualizar o lote principal
  update public.adjustment_batches
  set
    real_time = (payload->>'realTime')::numeric,
    progress = current_progress,
    status = case
        when current_progress >= 100 then 'Concluído'
        when (select delivery_date from public.adjustment_batches where id = b_id) < now() and current_progress < 100 then 'Atrasado'
        when total_real > 0 then 'Em Produção'
        else 'Planejado'
    end
  where id = b_id;
end;
$$;
