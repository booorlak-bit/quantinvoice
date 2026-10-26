-- Workspace schema: user accounts, and per-user companies, clients, projects, payment methods,
-- templates, payments and invoice activity. Additive only, so the previous release keeps working.
--
-- Every row belongs to a user (`user_id`). Rows that existed before accounts have no user yet;
-- the first account to sign in (the owner) claims them.

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  name text,
  avatar_url text,
  password_hash text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_single_owner on public.users (role) where role = 'owner';

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  name text not null,
  email text,
  contact_email text,
  tagline text,
  logo_url text,
  address text,
  tax_id text,
  website text,
  invoice_prefix text not null default 'INV-',
  default_currency text not null default 'USD' check (default_currency ~ '^[A-Z]{3}$'),
  default_notes jsonb not null default '[]' check (jsonb_typeof(default_notes) = 'array'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index companies_one_default_per_user on public.companies (user_id) where is_default;
create index companies_user_id on public.companies (user_id);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_user_id on public.clients (user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (client_id, name)
);
create index projects_user_id on public.projects (user_id);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('stripe', 'crypto', 'bank', 'link')),
  -- Public settings shown to payers (wallet address, bank details, payment link, Stripe mode).
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object'),
  -- AES-256-GCM encrypted JSON with secrets (Stripe secret key and webhook signing secret).
  secrets text,
  -- Added to new invoices automatically.
  is_default boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payment_methods_user_id on public.payment_methods (user_id);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  name text not null,
  service_type text,
  description text,
  style text not null default 'light' check (style in ('light', 'dark', 'alt-light', 'alt-dark', 'quantum')),
  currency text check (currency ~ '^[A-Z]{3}$'),
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array'),
  notes jsonb not null default '[]' check (jsonb_typeof(notes) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index templates_user_id on public.templates (user_id);

alter table public.invoices
  add column user_id uuid references public.users (id) on delete cascade,
  add column company_id uuid references public.companies (id) on delete restrict,
  add column client_id uuid references public.clients (id) on delete restrict,
  add column project_id uuid references public.projects (id) on delete set null,
  add column template_id uuid references public.templates (id) on delete set null,
  add column style text not null default 'light'
    check (style in ('light', 'dark', 'alt-light', 'alt-dark', 'quantum')),
  add column stripe_link text,
  add column sent_at timestamptz,
  add column paid_at timestamptz;
alter table public.invoices alter column client_name drop not null;
create index invoices_user_id on public.invoices (user_id);
create index invoices_client_id on public.invoices (client_id);
create index invoices_company_id on public.invoices (company_id);
create unique index invoices_user_number on public.invoices (user_id, number);

alter table public.invoice_items add column user_id uuid references public.users (id) on delete cascade;

create table public.invoice_payment_methods (
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  method_id uuid not null references public.payment_methods (id) on delete cascade,
  primary key (invoice_id, method_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  paid_at timestamptz not null default now(),
  method_id uuid references public.payment_methods (id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'stripe')),
  external_id text unique,
  note text,
  created_at timestamptz not null default now()
);
create index payments_user_paid_at on public.payments (user_id, paid_at);
create index payments_invoice_id on public.payments (invoice_id);

create table public.invoice_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  type text not null check (type in ('created', 'sent', 'viewed', 'payment', 'paid', 'status')),
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index invoice_events_invoice_id on public.invoice_events (invoice_id, created_at);

-- Carry the existing single-business data over.
insert into public.companies (name, email, contact_email, tagline, logo_url, invoice_prefix, default_currency, default_notes, is_default)
select name, email, contact_email, tagline, logo_url, 'QT-', default_currency, default_notes, true
from public.business;

insert into public.clients (name, email, created_at)
select client_name, client_email, min(created_at)
from public.invoices
where client_name is not null
group by client_name, client_email;

update public.invoices i
set client_id = c.id
from public.clients c
where i.client_id is null and c.name = i.client_name and c.email is not distinct from i.client_email;

update public.invoices
set company_id = (select id from public.companies where is_default limit 1)
where company_id is null;

update public.invoices set stripe_link = payment_url where payment_url is not null and stripe_link is null;

-- The demo invoices from the original template are dated 2023; move them into the dashboard's window.
update public.invoices
set issue_date = issue_date + interval '3 years', due_date = due_date + interval '3 years'
where issue_date < date '2024-01-01' and number in ('QT-001', 'QT-002', 'QT-003', 'QT-004', 'QT-005', 'QT-006');

update public.invoices set paid_at = coalesce(due_date, issue_date)::timestamptz where status = 'paid' and paid_at is null;

insert into public.payments (invoice_id, amount, currency, paid_at)
select i.id, sum(it.amount), i.currency, i.paid_at
from public.invoices i
join public.invoice_items it on it.invoice_id = i.id
where i.status = 'paid'
group by i.id
having sum(it.amount) > 0;

insert into public.invoice_events (invoice_id, type, created_at)
select id, 'created', created_at from public.invoices;

-- Access: only the application role, never the Data API roles.
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.payment_methods enable row level security;
alter table public.templates enable row level security;
alter table public.invoice_payment_methods enable row level security;
alter table public.payments enable row level security;
alter table public.invoice_events enable row level security;

revoke all on public.users, public.companies, public.clients, public.projects, public.payment_methods,
  public.templates, public.invoice_payment_methods, public.payments, public.invoice_events
  from anon, authenticated;

grant select, insert, update, delete on public.users, public.companies, public.clients, public.projects,
  public.payment_methods, public.templates, public.invoice_payment_methods, public.payments, public.invoice_events
  to quantinvoice_app;

create policy app_full_access on public.users for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.companies for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.clients for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.projects for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.payment_methods for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.templates for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.invoice_payment_methods for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.payments for all to quantinvoice_app using (true) with check (true);
create policy app_full_access on public.invoice_events for all to quantinvoice_app using (true) with check (true);

create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger payment_methods_set_updated_at before update on public.payment_methods
  for each row execute function public.set_updated_at();
create trigger templates_set_updated_at before update on public.templates
  for each row execute function public.set_updated_at();
