import "server-only";
import type { TransactionSql } from "postgres";
import { sql } from "./db";
import type {
  Business,
  BusinessInput,
  Invoice,
  InvoiceInput,
  InvoiceStatus,
  InvoiceSummary,
} from "./types";

const FALLBACK_BUSINESS: Business = {
  name: "Invoices",
  email: null,
  contactEmail: null,
  tagline: null,
  logoUrl: null,
  defaultCurrency: "USD",
  defaultNotes: [],
};

export async function getBusiness(): Promise<Business> {
  const [row] = await sql<Business[]>`
    select name, email, contact_email, tagline, logo_url, default_currency, default_notes
    from business
    limit 1
  `;
  return row ?? FALLBACK_BUSINESS;
}

export async function saveBusiness(input: BusinessInput) {
  await sql`
    insert into business ${sql({ ...input, defaultNotes: sql.json(input.defaultNotes) })}
    on conflict (id) do update set
      name = excluded.name,
      email = excluded.email,
      contact_email = excluded.contact_email,
      tagline = excluded.tagline,
      logo_url = excluded.logo_url,
      default_currency = excluded.default_currency,
      default_notes = excluded.default_notes
  `;
}

const invoiceColumns = sql`
  i.id, i.number, i.slug, i.title, i.status, i.client_name, i.client_email,
  i.issue_date::text as issue_date, i.due_date::text as due_date, i.currency,
  i.tax_note, i.payment_url, i.payment_label, i.notes,
  coalesce(
    (select json_agg(json_build_object(
        'title', it.title, 'description', it.description, 'amount', it.amount::text
      ) order by it.position)
     from invoice_items it where it.invoice_id = i.id),
    '[]'
  ) as items
`;

export async function getInvoiceBySlug(slug: string): Promise<Invoice | null> {
  const [row] = await sql<Invoice[]>`select ${invoiceColumns} from invoices i where i.slug = ${slug}`;
  return row ?? null;
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!isUuid(id)) return null;
  const [row] = await sql<Invoice[]>`select ${invoiceColumns} from invoices i where i.id = ${id}`;
  return row ?? null;
}

export async function listInvoices(filter: {
  status?: InvoiceStatus;
  query?: string;
}): Promise<InvoiceSummary[]> {
  const pattern = filter.query ? `%${filter.query.replace(/[\\%_]/g, "\\$&")}%` : null;
  return sql<InvoiceSummary[]>`
    select
      i.id, i.number, i.slug, i.title, i.status, i.client_name,
      i.issue_date::text as issue_date, i.due_date::text as due_date, i.currency,
      coalesce(sum(it.amount), 0)::text as total
    from invoices i
    left join invoice_items it on it.invoice_id = i.id
    where true
      ${filter.status ? sql`and i.status = ${filter.status}` : sql``}
      ${pattern ? sql`and (i.title ilike ${pattern} or i.number ilike ${pattern} or i.client_name ilike ${pattern})` : sql``}
    group by i.id
    order by i.issue_date desc, i.number desc
  `;
}

export async function suggestInvoiceNumber(): Promise<string> {
  const [row] = await sql<{ number: string }[]>`
    select number from invoices order by created_at desc, number desc limit 1
  `;
  const match = row?.number.match(/^(.*?)(\d+)$/);
  if (!match) return "INV-001";
  const [, prefix, digits] = match;
  return prefix + String(Number(digits) + 1).padStart(digits.length, "0");
}

export async function createInvoice(input: InvoiceInput): Promise<string> {
  return sql.begin(async (tx) => {
    const [{ id }] = await tx<{ id: string }[]>`
      insert into invoices ${tx(invoiceRow(input, tx))}
      returning id
    `;
    await insertItems(tx, id, input);
    return id;
  });
}

export async function updateInvoice(id: string, input: InvoiceInput) {
  await sql.begin(async (tx) => {
    await tx`update invoices set ${tx(invoiceRow(input, tx))} where id = ${id}`;
    await tx`delete from invoice_items where invoice_id = ${id}`;
    await insertItems(tx, id, input);
  });
}

export async function deleteInvoice(id: string) {
  if (!isUuid(id)) return;
  await sql`delete from invoices where id = ${id}`;
}

type Tx = TransactionSql;

function invoiceRow(input: InvoiceInput, tx: Tx) {
  return {
    number: input.number,
    slug: input.slug,
    title: input.title,
    status: input.status,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    taxNote: input.taxNote,
    paymentUrl: input.paymentUrl,
    paymentLabel: input.paymentLabel,
    notes: tx.json(input.notes),
  };
}

async function insertItems(tx: Tx, invoiceId: string, input: InvoiceInput) {
  if (input.items.length === 0) return;
  const rows = input.items.map((item, index) => ({
    invoiceId,
    position: index + 1,
    title: item.title,
    description: item.description,
    amount: item.amount,
  }));
  await tx`insert into invoice_items ${tx(rows)}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
