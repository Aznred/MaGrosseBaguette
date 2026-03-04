-- =============================================================================
-- Sandwich Planner – Table de stockage Supabase
-- =============================================================================
-- À exécuter dans le SQL Editor de ton projet Supabase :
-- Dashboard Supabase → ton projet → SQL Editor → New query → coller ce script → Run
--
-- La table stocke tout l’état de l’app dans une seule colonne JSON (payload) :
--   - ingredients (liste des ingrédients, CSV ou ajout manuel)
--   - customSandwiches (recettes personnalisées)
--   - quantites (grammes/unités par portion)
--   - sandwichNames (noms des sandwichs)
--   - ventesParNomSandwich (compta : menus vendus par sandwich)
--   - ventesBoissons (compta : boissons vendues à l’unité)
--   - ventesSnacks (compta : snacks/desserts vendus)
--   - removedAutoSignatures (sandwichs générés supprimés par l’utilisateur)
-- =============================================================================

create table if not exists public.app_store (
  id text primary key default 'default',
  payload jsonb not null default '{}'::jsonb
);

-- Commentaire pour documenter la colonne
comment on column public.app_store.payload is 'JSON complet : ingredients, customSandwiches, quantites, sandwichNames, ventesParNomSandwich, ventesBoissons, ventesSnacks, removedAutoSignatures';

-- Une seule ligne pour tout le store partagé
insert into public.app_store (id, payload)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

-- =============================================================================
-- Table dédiée à la comptabilité (ventes) – sauvegarde fiable
-- =============================================================================
create table if not exists public.app_compta (
  id text primary key default 'default',
  ventes_menus jsonb not null default '{}'::jsonb,
  ventes_boissons jsonb not null default '{}'::jsonb,
  ventes_snacks jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.app_compta is 'Ventes : menus par sandwich, boissons, snacks (comptabilité)';

insert into public.app_compta (id, ventes_menus, ventes_boissons, ventes_snacks)
values ('default', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

-- =============================================================================
-- Utilisateurs autorisés (liés à Forge ID EPITA) – permissions d'accès
-- =============================================================================
-- Seuls les utilisateurs présents dans cette table peuvent accéder à l'app.
-- forge_sub = subject OIDC renvoyé par la Forge (identifiant stable).
-- role : 'admin' (peut gérer les utilisateurs) ou 'user'.
-- =============================================================================
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  forge_sub text not null unique,
  email text,
  name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create index if not exists idx_app_users_forge_sub on public.app_users (forge_sub);
comment on table public.app_users is 'Utilisateurs autorisés (login Forge EPITA). Seuls ces utilisateurs ont accès à l''app.';
