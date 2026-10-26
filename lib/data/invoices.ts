import "server-only";
import type { PendingQuery, Row, TransactionSql } from "postgres";
import { sql } from "../db";
import { sumItems } from "../format";
import type {
  Invoice,
  InvoiceFilters,
  InvoiceInput,
  InvoiceStatus,
  InvoiceSummary,
  Sort,
} from "../types";
import { isUuid } from "./clients";

type Fragment = PendingQuery<Row[]>;
type Tx = TransactionSql;

/** WHERE conditions (each starting with "and") for the shared invoice filters, on alias `i`. */
export function filterConditions(filters: InvoiceFilters): Fragment {
  const parts: Fragment[] = [];
  if (filters.companyId && isUuid(filters.companyId)) parts.push(sql`and i.company_id = ${filters.companyId}`);
  if (filters.clientId && isUuid(filters.clientId)) parts.push(sql`and i.client_id = ${filters.clientId}`);
  if (filters.projectId && isUuid(filters.projectId)) parts.push(sql`and i.project_id = ${filters.projectId}`);
  if (filters.currency && /^[A-Z]{3}$/.test(filters.currency)) parts.push(sql`and i.currency = ${filters.currency}`);
  switch (filters.status) {
    case "draft":
    case "paid":
      parts.push(sql`and i.status = ${filters.status}`);
      break;
    case "not_paid":
      parts.push(sql`and i.status = 'not_paid'`);
      break;
    case "overdue":
      parts.push(sql`and i.status = 'not_paid' and i.due_date < current_date`);
      break;
  }
  const range = periodRange(filters);
  if (range.from) parts.push(sql`and i.issue_date >= ${range.from}::date`);
  if (range.to) parts.push(sql`and i.issue_date <= ${range.to}::date`);
  if (filters.query) {
    const pattern = `%${filters.query.replace(/[\\%_]/g, "\\$&")}%`;
    parts.push(sql`and (i.title ilike ${pattern} or i.number ilike ${pattern} or cl.name ilike ${pattern}
      or cl.company ilike ${pattern} or pr.name ilike ${pattern})`);
  }
  return parts.reduce((all, part) => sql`${all} ${part}`, sql``);
}

/** Resolves a period filter to an inclusive ISO date range (dates in UTC). */
export function periodRange(filters: Pick<InvoiceFilters, "period" | "from" | "to">): { from?: string; to?: string } {
  const today = new Date();
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  switch (filters.period) {
    case "this-month":
      return { from: iso(new Date(Date.UTC(y, m, 1))) };
    case "last-month":
      return { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) };
    case "last-30":
      return { from: iso(new Date(today.getTime() - 30 * 86_400_000)) };
    case "quarter":
      return { from: iso(new Date(Date.UTC(y, m - (m % 3), 1))) };
    case "year":
      return { from: iso(new Date(Date.UTC(y, 0, 1))) };
    case "custom":
      return {
        from: filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from) ? filters.from : undefined,
        to: filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to) ? filters.to : undefined,
      };
    default:
      return {};
  }
}

const summaryFrom = sql`
  from invoices i
  left join companies co on co.id = i.company_id
  left join clients cl on cl.id = i.client_id
  left join projects pr on pr.id = i.project_id
  left join lateral (select sum(amount) as total from invoice_items where invoice_id = i.id) t on true
  left join lateral (select sum(amount) as paid from payments where invoice_id = i.id) pa on true
`;

const summaryColumns = sql`
  i.id, i.number, i.slug, i.title, i.status, i.currency,
  i.issue_date::text as issue_date, i.due_date::text as due_date,
  (i.status = 'not_paid' and i.due_date < current_date) as overdue,
  coalesce(t.total, 0)::text as total, coalesce(pa.paid, 0)::text as paid_total,
  i.company_id, coalesce(co.name, '') as company_name,
  i.client_id, coalesce(cl.name, i.client_name, '') as client_name, cl.company as client_company,
  i.project_id, pr.name as project_name
`;

function orderBy(sort: Sort): Fragment {
  const dir = sort.dir === "desc" ? sql`desc` : sql`asc`;
  const expression = {
    number: sql`i.number`,
    title: sql`lower(i.title)`,
    client: sql`lower(coalesce(cl.company, cl.name, i.client_name))`,
    project: sql`lower(pr.name)`,
    status: sql`case when i.status = 'not_paid' and i.due_date < current_date then 1 when i.status = 'not_paid' then 2 when i.status = 'draft' then 3 else 4 end`,
    issue: sql`i.issue_date`,
    due: sql`i.due_date`,
    total: sql`coalesce(t.total, 0)`,
  }[sort.key];
  return sql`order by ${expression} ${dir} nulls last, i.issue_date desc, i.number desc`;
}

export async function listInvoices(userId: string, filters: InvoiceFilters, sort: Sort) {
  return sql<InvoiceSummary[]>`
    select ${summaryColumns} ${summaryFrom}
    where i.user_id = ${userId} ${filterConditions(filters)}
    ${orderBy(sort)}
  `;
}

/** Currencies used by the user's invoices, most used first. */
export async function listCurrencies(userId: string) {
  const rows = await sql<{ currency: string }[]>`
    select currency from invoices where user_id = ${userId} group by currency order by count(*) desc, currency
  `;
  return rows.map((row) => row.currency);
}

const invoiceColumns = sql`
  i.id, i.number, i.slug, i.title, i.status, i.currency, i.tax_note, i.style, i.stripe_link, i.notes, i.template_id,
  i.issue_date::text as issue_date, i.due_date::text as due_date,
  i.sent_at::text as sent_at, i.paid_at::text as paid_at, i.created_at::text as created_at,
  coalesce((
    select json_agg(json_build_object('title', it.title, 'description', it.description, 'amount', it.amount::text)
      order by it.position)
    from invoice_items it where it.invoice_id = i.id
  ), '[]') as items,
  (select row_to_json(co) from companies co where co.id = i.company_id) as company,
  (select row_to_json(x) from (
     select cl.id, cl.name, cl.company, cl.email, cl.phone, cl.address, cl.website, cl.notes, cl.created_at,
       coalesce((select json_agg(json_build_object('id', p.id, 'client_id', p.client_id, 'name', p.name) order by p.name)
                 from projects p where p.client_id = cl.id), '[]') as projects
     from clients cl where cl.id = i.client_id
   ) x) as client,
  (select json_build_object('id', p.id, 'client_id', p.client_id, 'name', p.name) from projects p where p.id = i.project_id) as project,
  coalesce((select json_agg(method_id) from invoice_payment_methods where invoice_id = i.id), '[]') as method_ids,
  coalesce((select sum(amount) from payments where invoice_id = i.id), 0)::text as paid_total
`;

export async function getInvoice(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await sql<Invoice[]>`select ${invoiceColumns} from invoices i where i.id = ${id} and i.user_id = ${userId}`;
  return row ?? null;
}

/** For the public invoice page; also returns the owning user's id for their payment methods. */
export async function getPublicInvoice(slug: string) {
  const [row] = await sql<(Invoice & { userId: string })[]>`
    select ${invoiceColumns}, i.user_id from invoices i where i.slug = ${slug} and i.user_id is not null
  `;
  return row ?? null;
}

export async function suggestInvoiceNumber(userId: string, prefix: string) {
  const rows = await sql<{ number: string }[]>`
    select number from invoices where user_id = ${userId} and number like ${prefix.replace(/[\\%_]/g, "\\$&") + "%"}
  `;
  const highest = rows.reduce((max, row) => {
    const digits = row.number.slice(prefix.length).match(/^\d+$/);
    return digits ? Math.max(max, Number(digits[0])) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

async function assertOwned(tx: Tx, userId: string, input: InvoiceInput) {
  const [check] = await tx<{ company: boolean; client: boolean; project: boolean; methods: number }[]>`
    select
      exists(select 1 from companies where id = ${input.companyId} and user_id = ${userId}) as company,
      exists(select 1 from clients where id = ${input.clientId} and user_id = ${userId}) as client,
      ${input.projectId
        ? tx`exists(select 1 from projects where id = ${input.projectId} and client_id = ${input.clientId} and user_id = ${userId})`
        : tx`true`} as project,
      (select count(*)::int from payment_methods where user_id = ${userId} and id = any(${input.methodIds}::uuid[])) as methods
  `;
  if (!check.company || !check.client || !check.project || check.methods !== input.methodIds.length) {
    throw new Error("Invoice references records outside this account");
  }
}

function invoiceRow(tx: Tx, input: InvoiceInput) {
  return {
    companyId: input.companyId,
    clientId: input.clientId,
    projectId: input.projectId,
    templateId: input.templateId,
    number: input.number,
    slug: input.slug,
    title: input.title,
    status: input.status,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    taxNote: input.taxNote,
    style: input.style,
    stripeLink: input.stripeLink,
    notes: tx.json(input.notes),
  };
}

async function writeChildren(tx: Tx, userId: string, invoiceId: string, input: InvoiceInput) {
  await tx`delete from invoice_items where invoice_id = ${invoiceId}`;
  if (input.items.length) {
    await tx`insert into invoice_items ${tx(
      input.items.map((item, index) => ({
        userId,
        invoiceId,
        position: index + 1,
        title: item.title,
        description: item.description,
        amount: item.amount,
      })),
    )}`;
  }
  await tx`delete from invoice_payment_methods where invoice_id = ${invoiceId}`;
  if (input.methodIds.length) {
    await tx`insert into invoice_payment_methods ${tx(input.methodIds.map((methodId) => ({ invoiceId, methodId })))}`;
  }
}

export async function createInvoice(userId: string, input: InvoiceInput) {
  return sql.begin(async (tx) => {
    await assertOwned(tx, userId, input);
    const [{ id }] = await tx<{ id: string }[]>`
      insert into invoices ${tx({ ...invoiceRow(tx, input), userId })} returning id
    `;
    await writeChildren(tx, userId, id, input);
    await tx`insert into invoice_events (user_id, invoice_id, type) values (${userId}, ${id}, 'created')`;
    return id;
  });
}

export async function updateInvoice(userId: string, id: string, input: InvoiceInput) {
  await sql.begin(async (tx) => {
    await assertOwned(tx, userId, input);
    const [updated] = await tx`
      update invoices set ${tx(invoiceRow(tx, input))} where id = ${id} and user_id = ${userId} returning id
    `;
    if (!updated) throw new Error("Invoice not found");
    await writeChildren(tx, userId, id, input);
  });
}

export async function deleteInvoices(userId: string, ids: string[]) {
  const valid = ids.filter(isUuid);
  if (!valid.length) return 0;
  const rows = await sql`delete from invoices where user_id = ${userId} and id = any(${valid}::uuid[]) returning id`;
  return rows.count;
}

/**
 * Sets the status of several invoices. Marking paid records a manual payment for whatever is still owed;
 * moving a paid invoice back removes its manual payments (Stripe payments stay on record).
 */
export async function setInvoicesStatus(userId: string, ids: string[], status: InvoiceStatus) {
  const valid = ids.filter(isUuid);
  if (!valid.length) return;
  await sql.begin(async (tx) => {
    if (status === "paid") {
      await tx`
        insert into payments (user_id, invoice_id, amount, currency, source, note)
        select i.user_id, i.id, t.total - coalesce(pa.paid, 0), i.currency, 'manual', 'Marked as paid'
        from invoices i
        join lateral (select sum(amount) as total from invoice_items where invoice_id = i.id) t on true
        left join lateral (select sum(amount) as paid from payments where invoice_id = i.id) pa on true
        where i.user_id = ${userId} and i.id = any(${valid}::uuid[]) and i.status <> 'paid'
          and t.total - coalesce(pa.paid, 0) > 0
      `;
      await tx`update invoices set status = 'paid', paid_at = now()
               where user_id = ${userId} and id = any(${valid}::uuid[]) and status <> 'paid'`;
    } else {
      await tx`delete from payments where user_id = ${userId} and source = 'manual' and invoice_id = any(${valid}::uuid[])`;
      await tx`update invoices set status = ${status}, paid_at = null
               where user_id = ${userId} and id = any(${valid}::uuid[])`;
    }
    await tx`
      insert into invoice_events (user_id, invoice_id, type, detail)
      select ${userId}, id, 'status', ${tx.json({ status })} from invoices where user_id = ${userId} and id = any(${valid}::uuid[])
    `;
  });
}

export type Payment = {
  id: string;
  amount: string;
  currency: string;
  paidAt: string;
  source: "manual" | "stripe";
  note: string | null;
  methodName: string | null;
};

export async function listPayments(userId: string, invoiceId: string) {
  return sql<Payment[]>`
    select p.id, p.amount::text as amount, p.currency, p.paid_at::text as paid_at, p.source, p.note, m.name as method_name
    from payments p left join payment_methods m on m.id = p.method_id
    where p.user_id = ${userId} and p.invoice_id = ${invoiceId}
    order by p.paid_at desc
  `;
}

/** Records a payment and marks the invoice paid once payments cover the total. */
export async function recordPayment(
  userId: string,
  invoiceId: string,
  payment: { amount: string; paidAt: string; methodId: string | null; note: string | null },
) {
  await sql.begin(async (tx) => {
    const [invoice] = await tx<{ currency: string; items: Invoice["items"] }[]>`
      select currency,
        coalesce((select json_agg(json_build_object('amount', amount::text)) from invoice_items where invoice_id = invoices.id), '[]') as items
      from invoices where id = ${invoiceId} and user_id = ${userId}
    `;
    if (!invoice) throw new Error("Invoice not found");
    await tx`
      insert into payments (user_id, invoice_id, amount, currency, paid_at, method_id, source, note)
      values (${userId}, ${invoiceId}, ${payment.amount}, ${invoice.currency}, ${payment.paidAt}::timestamptz,
              ${payment.methodId}, 'manual', ${payment.note})
    `;
    await settleIfPaid(tx, invoiceId, sumItems(invoice.items));
    await tx`insert into invoice_events (user_id, invoice_id, type, detail)
             values (${userId}, ${invoiceId}, 'payment', ${tx.json({ amount: payment.amount })})`;
  });
}

export async function deletePayment(userId: string, paymentId: string) {
  await sql.begin(async (tx) => {
    const [payment] = await tx<{ invoiceId: string }[]>`
      delete from payments where id = ${paymentId} and user_id = ${userId} and source = 'manual' returning invoice_id
    `;
    if (!payment) return;
    await tx`
      update invoices set status = 'not_paid', paid_at = null
      where id = ${payment.invoiceId} and status = 'paid'
        and coalesce((select sum(amount) from payments where invoice_id = ${payment.invoiceId}), 0)
          < coalesce((select sum(amount) from invoice_items where invoice_id = ${payment.invoiceId}), 0)
    `;
  });
}

/** Marks the invoice paid when its payments reach the total. Exported for the Stripe webhook. */
export async function settleIfPaid(tx: Tx, invoiceId: string, total: string) {
  await tx`
    update invoices set status = 'paid', paid_at = now()
    where id = ${invoiceId} and status <> 'paid'
      and coalesce((select sum(amount) from payments where invoice_id = ${invoiceId}), 0) >= ${total}::numeric
  `;
}

export type InvoiceEvent = { id: string; type: string; detail: Record<string, unknown>; createdAt: string };

export async function listEvents(userId: string, invoiceId: string) {
  return sql<InvoiceEvent[]>`
    select id, type, detail, created_at::text as created_at from invoice_events
    where user_id = ${userId} and invoice_id = ${invoiceId} order by created_at desc limit 50
  `;
}

export async function addEvent(userId: string, invoiceId: string, type: string, detail: Record<string, unknown> = {}) {
  await sql`insert into invoice_events (user_id, invoice_id, type, detail) values (${userId}, ${invoiceId}, ${type}, ${sql.json(detail as never)})`;
}

export type StatusCounts = { all: number; draft: number; notPaid: number; overdue: number; paid: number };

/** Invoice counts per status tab under every filter except the status itself. */
export async function countByStatus(userId: string, filters: InvoiceFilters): Promise<StatusCounts> {
  const [row] = await sql<StatusCounts[]>`
    select count(*)::int as all,
      count(*) filter (where i.status = 'draft')::int as draft,
      count(*) filter (where i.status = 'not_paid')::int as not_paid,
      count(*) filter (where i.status = 'not_paid' and i.due_date < current_date)::int as overdue,
      count(*) filter (where i.status = 'paid')::int as paid
    from invoices i
    left join clients cl on cl.id = i.client_id
    left join projects pr on pr.id = i.project_id
    where i.user_id = ${userId} ${filterConditions({ ...filters, status: undefined })}
  `;
  return row;
}

/** Logs a client view, at most once per half hour per invoice. */
export async function recordView(invoiceId: string, userId: string) {
  await sql`
    insert into invoice_events (user_id, invoice_id, type)
    select ${userId}, ${invoiceId}, 'viewed'
    where not exists (
      select 1 from invoice_events where invoice_id = ${invoiceId} and type = 'viewed' and created_at > now() - interval '30 minutes'
    )
  `;
}

/** Records that the invoice went to the client; a draft becomes unpaid so the client can open it. */
export async function markSent(userId: string, invoiceId: string, to: string[]) {
  await sql.begin(async (tx) => {
    await tx`
      update invoices set sent_at = now(), status = case when status = 'draft' then 'not_paid' else status end
      where id = ${invoiceId} and user_id = ${userId}
    `;
    await tx`insert into invoice_events (user_id, invoice_id, type, detail) values (${userId}, ${invoiceId}, 'sent', ${tx.json({ to: to.join(", ") })})`;
  });
}
