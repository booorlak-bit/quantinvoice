-- Brands can email invoices from their own address on the app's sending domain: `studio` sends as
-- "Studio <studio@mail.example.com>". Only the part before the @ is stored; the domain comes from EMAIL_FROM.
alter table public.companies
  add column sender text check (sender ~ '^[a-z0-9]+([._-][a-z0-9]+)*$' and length(sender) <= 40);

-- Every account shares the sending domain, so each address belongs to one brand only.
create unique index companies_sender_unique on public.companies (sender);
