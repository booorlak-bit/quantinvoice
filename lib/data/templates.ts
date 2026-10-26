import "server-only";
import { sql } from "../db";
import type { InvoiceItem, InvoiceStyle, Note } from "../types";

export type Template = {
  id: string;
  name: string;
  serviceType: string | null;
  description: string | null;
  style: InvoiceStyle;
  currency: string | null;
  items: InvoiceItem[];
  notes: Note[];
  updatedAt: string;
  invoiceCount: number;
};

const templateColumns = sql`
  t.id, t.name, t.service_type, t.description, t.style, t.currency, t.items, t.notes, t.updated_at::text as updated_at,
  (select count(*)::int from invoices i where i.template_id = t.id) as invoice_count
`;

export async function listTemplates(userId: string) {
  return sql<Template[]>`select ${templateColumns} from templates t where t.user_id = ${userId} order by lower(t.name)`;
}

export async function getTemplate(userId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await sql<Template[]>`select ${templateColumns} from templates t where t.user_id = ${userId} and t.id = ${id}`;
  return row ?? null;
}

export type TemplateInput = Pick<Template, "name" | "serviceType" | "description" | "style" | "currency" | "items" | "notes">;

export async function saveTemplate(userId: string, id: string | null, input: TemplateInput) {
  const row = {
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    style: input.style,
    currency: input.currency,
    items: sql.json(input.items as never),
    notes: sql.json(input.notes as never),
  };
  if (id) {
    await sql`update templates set ${sql(row)} where id = ${id} and user_id = ${userId}`;
    return id;
  }
  const [created] = await sql<{ id: string }[]>`insert into templates ${sql({ ...row, userId })} returning id`;
  return created.id;
}

export async function deleteTemplate(userId: string, id: string) {
  await sql`delete from templates where id = ${id} and user_id = ${userId}`;
}
