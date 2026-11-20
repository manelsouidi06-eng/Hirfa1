-- =====================================================
-- supabase-orders.sql  |  ÉTAPE 2 sur 3  |  relançable sans perdre de commandes
-- À exécuter APRÈS supabase-setup.sql.
-- Livraison : 8 TND, offerte dès 150 TND (à garder identique à script.js).
-- =====================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  attempt_id uuid not null,                       -- évite les doublons si on réessaie
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  items jsonb not null,                           -- instantané : noms et prix du moment
  shipping jsonb not null,
  payment_method text not null check (payment_method in ('carte-demo','livraison-demo')),
  subtotal_millimes bigint not null check (subtotal_millimes >= 0),
  delivery_millimes bigint not null check (delivery_millimes >= 0),
  total_millimes bigint not null check (total_millimes >= 0),
  status text not null default 'nouvelle' check (status in ('nouvelle','en_preparation','terminee','annulee')),
  unique (user_id, attempt_id)
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create sequence if not exists public.order_ref_seq;

-- updated_at change à chaque modification (sert à détecter les modifications simultanées)
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Droits : lecture, et modification de la colonne STATUT seulement. Pas d'insertion directe.
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
alter table public.orders enable row level security;

drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists orders_admin_select on public.orders;
create policy orders_admin_select on public.orders
  for select to authenticated using (public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Création d'une commande : seul chemin autorisé. Prix et propriétaire viennent de la base.
create or replace function public.create_demo_order(
  p_attempt_id uuid, p_items jsonb, p_shipping jsonb, p_payment text, p_expected_total bigint)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_lines jsonb; v_sub bigint; v_del bigint; v_total bigint; v_found integer; k text;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '28000'; end if;
  if p_attempt_id is null then raise exception 'Tentative invalide'; end if;

  -- Même tentative déjà enregistrée : on renvoie la commande existante
  select * into v_order from public.orders where user_id = v_uid and attempt_id = p_attempt_id;
  if found then return to_jsonb(v_order); end if;

  if p_payment is null or p_payment not in ('carte-demo','livraison-demo') then
    raise exception 'Moyen de paiement invalide'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Panier invalide'; end if;
  if p_shipping is null or jsonb_typeof(p_shipping) <> 'object' then
    raise exception 'Livraison invalide'; end if;
  foreach k in array array['prenom','nom','email','telephone','adresse','ville','code_postal','pays'] loop
    if coalesce(btrim(p_shipping ->> k), '') = '' or length(p_shipping ->> k) > 200 then
      raise exception 'Champ de livraison manquant ou trop long : %', k; end if;
  end loop;

  -- Quantités entières 1 à 99, produits sans doublon
  if exists (select 1 from jsonb_array_elements(p_items) e
             where case when (e ->> 'qty') ~ '^[0-9]{1,2}$'
                        then (e ->> 'qty')::int not between 1 and 99 else true end) then
    raise exception 'Quantité invalide'; end if;
  if (select count(distinct e ->> 'id') from jsonb_array_elements(p_items) e)
     <> jsonb_array_length(p_items) then
    raise exception 'Produit en double dans le panier'; end if;

  select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'category', p.category,
           'price_millimes', p.price_millimes, 'qty', i.qty,
           'line_millimes', p.price_millimes::bigint * i.qty) order by p.id),
         sum(p.price_millimes::bigint * i.qty), count(*)
    into v_lines, v_sub, v_found
  from (select e ->> 'id' as id, (e ->> 'qty')::int as qty from jsonb_array_elements(p_items) e) i
  join public.products p on p.id = i.id and p.available;

  if v_found <> jsonb_array_length(p_items) then
    raise exception 'Produit indisponible ou inconnu'; end if;

  v_del := case when v_sub >= 150000 then 0 else 8000 end;   -- millimes
  v_total := v_sub + v_del;
  if p_expected_total is distinct from v_total then
    raise exception 'PRIX_CHANGE' using hint = v_total::text; end if;

  insert into public.orders (reference, user_id, attempt_id, items, shipping, payment_method,
                             subtotal_millimes, delivery_millimes, total_millimes)
  values ('HIR-' || lpad(nextval('public.order_ref_seq')::text, 4, '0'), v_uid, p_attempt_id, v_lines,
          jsonb_build_object('prenom', btrim(p_shipping ->> 'prenom'), 'nom', btrim(p_shipping ->> 'nom'),
            'email', btrim(p_shipping ->> 'email'), 'telephone', btrim(p_shipping ->> 'telephone'),
            'adresse', btrim(p_shipping ->> 'adresse'), 'ville', btrim(p_shipping ->> 'ville'),
            'code_postal', btrim(p_shipping ->> 'code_postal'), 'pays', btrim(p_shipping ->> 'pays')),
          p_payment, v_sub, v_del, v_total)
  on conflict (user_id, attempt_id) do nothing
  returning * into v_order;

  if not found then   -- une autre requête identique vient d'écrire : on la renvoie
    select * into v_order from public.orders where user_id = v_uid and attempt_id = p_attempt_id;
  end if;
  return to_jsonb(v_order);
end $$;

revoke all on function public.create_demo_order(uuid, jsonb, jsonb, text, bigint) from public, anon;
grant execute on function public.create_demo_order(uuid, jsonb, jsonb, text, bigint) to authenticated;
