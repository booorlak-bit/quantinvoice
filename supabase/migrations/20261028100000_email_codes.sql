-- Sign-in by a one-time code sent to the account's email, replacing passwords.
--
-- Sessions are signed with a per-user `session_key`; rotating it signs the user out everywhere. Passwords are no
-- longer set, so `password_hash` becomes optional (existing hashes stay until a cleanup migration).

alter table public.users alter column password_hash drop not null;
alter table public.users add column session_key text not null default replace(gen_random_uuid()::text, '-', '');

-- Codes are stored as HMACs, expire after 10 minutes and allow a few attempts each.
create table public.login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  code_hash text not null,
  ip text,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index login_codes_email on public.login_codes (email, created_at desc);
create index login_codes_ip on public.login_codes (ip, created_at desc);

alter table public.login_codes enable row level security;
revoke all on public.login_codes from anon, authenticated;
grant select, insert, update, delete on public.login_codes to quantinvoice_app;
create policy app_full_access on public.login_codes for all to quantinvoice_app using (true) with check (true);
