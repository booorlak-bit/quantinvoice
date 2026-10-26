import "server-only";
import { sql } from "../db";
import type { Client, ClientSummary, Project } from "../types";

const clientColumns = sql`
  c.id, c.name, c.company, c.email, c.phone, c.address, c.website, c.notes, c.created_at::text as created_at,
  coalesce(
    (select json_agg(json_build_object('id', p.id, 'clientId', p.client_id, 'name', p.name) order by p.created_at)
     from projects p where p.client_id = c.id),
    '[]'
  ) as projects
`;

// Per-currency invoiced / paid / outstanding for one client, drafts excluded.
const clientTotals = sql`
  coalesce((
    select json_agg(t order by t.currency) from (
      select i.currency,
        coalesce(sum(it.total), 0)::text as invoiced,
        coalesce(sum(pa.paid), 0)::text as paid,
        greatest(coalesce(sum(it.total), 0) - coalesce(sum(pa.paid), 0), 0)::text as outstanding
      from invoices i
      left join lateral (select sum(amount) as total from invoice_items where invoice_id = i.id) it on true
      left join lateral (select sum(amount) as paid from payments where invoice_id = i.id) pa on true
      where i.client_id = c.id and i.status <> 'draft'
      group by i.currency
    ) t
  ), '[]') as totals
`;

export type ClientSort = "name" | "company" | "added" | "invoices";

export async function listClients(userId: string, options: { query?: string; sort?: ClientSort; dir?: "asc" | "desc" } = {}) {
  const pattern = options.query ? `%${options.query.replace(/[\\%_]/g, "\\$&")}%` : null;
  const direction = options.dir === "desc" ? sql`desc` : sql`asc`;
  const order = {
    name: sql`lower(c.name)`,
    company: sql`lower(coalesce(c.company, c.name))`,
    added: sql`c.created_at`,
    invoices: sql`invoice_count`,
  }[options.sort ?? "name"];
  return sql<ClientSummary[]>`
    select ${clientColumns}, ${clientTotals},
      (select count(*)::int from invoices i where i.client_id = c.id) as invoice_count
    from clients c
    where c.user_id = ${userId}
      ${pattern ? sql`and (c.name ilike ${pattern} or c.company ilike ${pattern} or c.email ilike ${pattern} or c.phone ilike ${pattern})` : sql``}
    order by ${order} ${direction}, c.created_at desc
  `;
}

/** Lightweight list for pickers and filters. */
export async function listClientOptions(userId: string) {
  return sql<Pick<Client, "id" | "name" | "company" | "email" | "projects">[]>`
    select c.id, c.name, c.company, c.email,
      coalesce((select json_agg(json_build_object('id', p.id, 'clientId', p.client_id, 'name', p.name) order by p.name)
                from projects p where p.client_id = c.id), '[]') as projects
    from clients c where c.user_id = ${userId} order by lower(coalesce(c.company, c.name))
  `;
}

export async function getClient(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await sql<ClientSummary[]>`
    select ${clientColumns}, ${clientTotals},
      (select count(*)::int from invoices i where i.client_id = c.id) as invoice_count
    from clients c where c.user_id = ${userId} and c.id = ${id}
  `;
  return row ?? null;
}

export type ClientInput = Pick<Client, "name" | "company" | "email" | "phone" | "address" | "website" | "notes">;

export async function createClient(userId: string, input: ClientInput) {
  const [row] = await sql<{ id: string }[]>`insert into clients ${sql({ ...input, userId })} returning id`;
  return row.id;
}

export async function updateClient(userId: string, id: string, input: ClientInput) {
  await sql`update clients set ${sql({ ...input })} where id = ${id} and user_id = ${userId}`;
}

/** Deletes a client without invoices. Returns false when invoices still reference it. */
export async function deleteClient(userId: string, id: string) {
  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count from invoices where user_id = ${userId} and client_id = ${id}
  `;
  if (count > 0) return false;
  await sql`delete from clients where id = ${id} and user_id = ${userId}`;
  return true;
}

/** Returns the project with this name for the client, creating it if needed. */
export async function ensureProject(userId: string, clientId: string, name: string) {
  const [client] = await sql<{ id: string }[]>`select id from clients where id = ${clientId} and user_id = ${userId}`;
  if (!client) throw new Error("Client not found");
  const [row] = await sql<Project[]>`
    insert into projects (user_id, client_id, name) values (${userId}, ${clientId}, ${name})
    on conflict (client_id, name) do update set name = excluded.name
    returning id, client_id, name
  `;
  return row;
}

export async function renameProject(userId: string, id: string, name: string) {
  await sql`update projects set name = ${name} where id = ${id} and user_id = ${userId}`;
}

export async function deleteProject(userId: string, id: string) {
  await sql`delete from projects where id = ${id} and user_id = ${userId}`;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
