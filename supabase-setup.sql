-- =====================================================
-- supabase-setup.sql  |  ÉTAPE 1 sur 3  |  BASE NEUVE UNIQUEMENT
-- À coller dans Supabase > SQL Editor > Run.
-- Ordre : 1) ce fichier  2) supabase-orders.sql  3) supabase-admin.sql
-- Prix en MILLIMES (1 TND = 1000 millimes) : calcul exact, sans virgule.
-- Si des tables existent déjà : NE PAS l'exécuter, demandez une migration.
-- =====================================================

create table public.products (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null check (length(name) between 1 and 120),
  category text not null check (category in ('Poterie et vaisselle','Vannerie et tressage','Cuivre et cuisine','Bois','Produits traditionnels')),
  description text not null default '',
  price_millimes integer not null check (price_millimes between 0 and 10000000),
  image text not null default '',
  features text not null default '',
  available boolean not null default true,
  created_at timestamptz not null default now()
);

-- Un compte SANS ligne ici est un client. Seule la valeur 'admin' existe.
create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin'))
);

-- Fonction : l'utilisateur connecté est-il admin ? (search_path vide = sûr)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles
                 where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Droits SQL (en plus de RLS)
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;   -- aucune écriture depuis le navigateur

-- RLS : sécurité ligne par ligne
alter table public.products enable row level security;
alter table public.user_roles enable row level security;

create policy products_read_available on public.products
  for select to anon, authenticated using (available);
create policy products_admin_select on public.products
  for select to authenticated using (public.is_admin());
create policy products_admin_insert on public.products
  for insert to authenticated with check (public.is_admin());
create policy products_admin_update on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin_delete on public.products
  for delete to authenticated using (public.is_admin());

create policy roles_read_own on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));
-- Volontairement AUCUNE policy insert/update/delete sur user_roles.

-- Données initiales : les 10 produits du site
insert into public.products (id, name, category, description, price_millimes, image, features, available) values
  ('assiette-poterie', 'Assiette en poterie peinte', 'Poterie et vaisselle', 'Assiette de table ou murale, décor peint à la main.', 35000, 'images/assiette-poterie.jpg', 'Terre cuite émaillée, décor peint à la main, diamètre environ 25 cm, chaque pièce est unique.', true),
  ('tajine-terre-cuite', 'Tajine en terre cuite', 'Poterie et vaisselle', 'Pour cuisiner ou servir, motifs traditionnels.', 70000, 'images/tajine-terre-cuite.jpg', 'Terre cuite, décor traditionnel peint à la main, couvercle conique, diamètre environ 30 cm.', true),
  ('couffin-tresse', 'Couffin tressé', 'Vannerie et tressage', 'Panier souple à anses, pour les courses ou le rangement.', 50000, 'images/couffin-tresse.jpg', 'Fibres naturelles, tressé à la main, deux anses, léger et résistant.', true),
  ('corbeille-jonc', 'Corbeille en jonc tressé', 'Vannerie et tressage', 'Corbeille décorative ou de rangement, tressée à la main.', 40000, 'images/corbeille-jonc.jpg', 'Jonc naturel, tressé à la main, diamètre environ 30 cm.', true),
  ('casserole-cuivre', 'Casserole en cuivre', 'Cuivre et cuisine', 'Ustensile de cuisine traditionnel en cuivre.', 110000, 'images/casserole-cuivre.jpg', 'Cuivre martelé, poignée solide, diamètre environ 18 cm.', true),
  ('plateau-cuivre', 'Plateau en cuivre ciselé', 'Cuivre et cuisine', 'Pour le thé ou la décoration, gravé à la main.', 95000, 'images/plateau-cuivre.jpg', 'Cuivre gravé à la main, diamètre environ 35 cm.', true),
  ('planche-bois', 'Planche à découper en bois', 'Bois', 'Bois naturel, pour couper et servir.', 45000, 'images/planche-bois.jpg', 'Bois naturel façonné à la main, longueur environ 35 cm, lavage à la main conseillé.', true),
  ('plat-bois', 'Verre ou plat en bois', 'Bois', 'Pièce de table façonnée dans le bois.', 30000, 'images/plat-bois.jpg', 'Bois massif façonné à la main, chaque pièce est unique, lavage à la main conseillé.', true),
  ('jarre-huile', 'Jarre d''huile d''olive traditionnelle', 'Produits traditionnels', 'Huile d''olive en jarre artisanale.', 40000, 'images/jarre-huile.jpg', 'Huile d''olive tunisienne, jarre artisanale, contenance environ 1 litre.', true),
  ('bougies', 'Bougies artisanales', 'Produits traditionnels', 'Bougies faites à la main, parfumées.', 20000, 'images/bougies.jpg', 'Cire, fabrication artisanale, plusieurs parfums possibles.', true);
