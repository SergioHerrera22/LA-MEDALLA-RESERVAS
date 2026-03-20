create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.cabins (
  id text primary key,
  name text not null,
  description text not null,
  capacity integer not null check (capacity > 0),
  price_per_night numeric(12, 2) not null check (price_per_night >= 0),
  amenities text[] not null default '{}',
  image text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists cabins_set_updated_at on public.cabins;
create trigger cabins_set_updated_at
before update on public.cabins
for each row
execute function public.set_updated_at();

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  cabin_id text not null references public.cabins(id) on update cascade on delete restrict,
  start_date date not null,
  end_date date not null,
  guest_name text not null,
  guest_phone text not null,
  guest_email text not null,
  number_of_guests integer not null check (number_of_guests > 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  status text not null check (status in ('confirmed', 'pending', 'cancelled', 'completed')),
  payment_status text not null check (payment_status in ('paid', 'pending', 'partial')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint reservations_date_order check (end_date >= start_date)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null check (category in ('maintenance', 'cleaning', 'utilities', 'supplies', 'other')),
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  cabin_id text references public.cabins(id) on update cascade on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists reservations_cabin_id_idx on public.reservations (cabin_id);
create index if not exists reservations_start_date_idx on public.reservations (start_date);
create index if not exists expenses_cabin_id_idx on public.expenses (cabin_id);
create index if not exists expenses_date_idx on public.expenses (date);

alter table public.cabins enable row level security;
alter table public.reservations enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "open_access_cabins" on public.cabins;
create policy "open_access_cabins"
on public.cabins
for all
using (true)
with check (true);

drop policy if exists "open_access_reservations" on public.reservations;
create policy "open_access_reservations"
on public.reservations
for all
using (true)
with check (true);

drop policy if exists "open_access_expenses" on public.expenses;
create policy "open_access_expenses"
on public.expenses
for all
using (true)
with check (true);