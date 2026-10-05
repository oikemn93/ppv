-- Schéma de référence pour le futur projet Supabase "ppv".
-- À appliquer uniquement sur le nouveau projet dédié, jamais sur les projets existants.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  fighter_a text not null,
  fighter_b text not null,
  starts_at timestamptz,
  price_fcfa integer not null check (price_fcfa >= 0),
  stream_url text,
  provider text,
  status text not null default 'draft' check (status in ('draft','published','live','ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  provider text not null,
  provider_token text unique,
  amount_fcfa integer not null check (amount_fcfa >= 0),
  status text not null default 'pending' check (status in ('pending','completed','cancelled','failed','refunded')),
  customer_phone text,
  customer_email text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete set null,
  code_hash text unique not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.events enable row level security;
alter table public.purchases enable row level security;
alter table public.access_codes enable row level security;

-- Le public ne voit que les événements publiés/live.
create policy "public_can_read_published_events"
on public.events
for select
to anon, authenticated
using (status in ('published','live','ended'));

-- Aucune politique publique n'est créée sur purchases/access_codes.
-- Les écritures/lectures sensibles passent par le backend avec une secret key.
