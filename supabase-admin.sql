-- =====================================================
-- supabase-admin.sql  |  ÉTAPE 3 sur 3
-- À exécuter dans SQL Editor APRÈS avoir créé votre compte sur le site.
-- 1) Supabase > Authentication > Users : copiez l'UUID de VOTRE compte.
-- 2) Remplacez VOTRE-UUID ci-dessous (en gardant les guillemets).
-- Cette attribution ne se fait JAMAIS depuis le navigateur.
-- =====================================================
insert into public.user_roles (user_id, role)
values ('VOTRE-UUID', 'admin')
on conflict (user_id) do update set role = 'admin';
-- Pour retirer le rôle : delete from public.user_roles where user_id = 'VOTRE-UUID';
