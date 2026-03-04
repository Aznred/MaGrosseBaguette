-- À exécuter dans le SQL Editor de ton projet Supabase :
-- Dashboard Supabase → ton projet → SQL Editor → New query → coller ce script → Run

create table if not exists public.app_store (
  id text primary key default 'default',
  payload jsonb not null default '{}'::jsonb
);

-- Une seule ligne pour tout le store partagé (ingrédients CSV, sandwichs, compta)
insert into public.app_store (id, payload)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
