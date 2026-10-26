-- Quantinvoice schema: a single business profile, invoices and their line items.
-- The app talks to Postgres through the shared pooler as the `quantinvoice_app` role.
-- The Supabase Data API roles (anon, authenticated) get no access at all.

create type public.invoice_status as enum ('draft', 'not_paid', 'paid');

create table public.business (
  id boolean primary key default true check (id), -- enforces a single row
  name text not null,
  email text,
  contact_email text, -- "Get in Touch" link on invoices; falls back to email
  tagline text,
  logo_url text,
  default_currency text not null default 'USD' check (default_currency ~ '^[A-Z]{3}$'),
  default_notes jsonb not null default '[]' check (jsonb_typeof(default_notes) = 'array'),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  status public.invoice_status not null default 'draft',
  client_name text not null,
  client_email text,
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  tax_note text not null default 'Calculated at Checkout',
  payment_url text,
  payment_label text not null default 'Pay with Stripe',
  notes jsonb not null default '[]' check (jsonb_typeof(notes) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  position integer not null,
  title text not null,
  description text,
  amount numeric(12, 2) check (amount >= 0), -- null renders as "Included"
  unique (invoice_id, position)
);

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger business_set_updated_at before update on public.business
  for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

alter table public.business enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

revoke all on public.business, public.invoices, public.invoice_items from anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Application role. Its password is set outside of version control:
--   alter role quantinvoice_app password '...';
create role quantinvoice_app login noinherit;
grant usage on schema public to quantinvoice_app;
grant usage on type public.invoice_status to quantinvoice_app;
grant select, insert, update, delete on public.business, public.invoices, public.invoice_items
  to quantinvoice_app;

create policy app_full_access on public.business
  for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.invoices
  for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.invoice_items
  for all to quantinvoice_app using (true) with check (true);
