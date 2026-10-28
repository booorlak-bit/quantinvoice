import "server-only";
import { connection } from "next/server";
import { sql } from "../db";
import type { InvoiceFilters } from "../types";
import { filterConditions } from "./invoices";

export const DASHBOARD_RANGES = ["3m", "6m", "12m"] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];
export const RANGE_MONTHS: Record<DashboardRange, number> = { "3m": 3, "6m": 6, "12m": 12 };
/** Months after the current one shown as scheduled income. */
export const MONTHS_AHEAD = 3;

export function parseRange(value: unknown): DashboardRange {
  return (DASHBOARD_RANGES as readonly unknown[]).includes(value) ? (value as DashboardRange) : "6m";
}

/** One column of the payments chart. Overdue balances are all counted in the current month: that money is due now. */
export type MonthPoint = { month: string; received: number; overdue: number; scheduled: number };

export type UpcomingInvoice = {
  id: string;
  number: string;
  title: string;
  dueDate: string;
  overdue: boolean;
  balance: string;
  clientName: string;
  clientCompany: string | null;
};

export type RecentPayment = {
  id: string;
  amount: string;
  paidAt: string;
  source: "manual" | "stripe";
  methodName: string | null;
  note: string | null;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string | null;
};

export type Dashboard = {
  months: MonthPoint[];
  currentMonth: string;
  received: number;
  receivedBefore: number;
  outstanding: number;
  outstandingCount: number;
  overdue: number;
  overdueCount: number;
  dueSoon: number;
  dueSoonCount: number;
  upcoming: UpcomingInvoice[];
  recent: RecentPayment[];
};

const iso = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Everything on the dashboard, in one currency: amounts in different currencies can't be added up.
 * The client, project and company filters scope every number.
 */
export async function getDashboard(
  userId: string,
  filters: Pick<InvoiceFilters, "companyId" | "clientId" | "projectId">,
  currency: string,
  range: DashboardRange,
): Promise<Dashboard> {
  // The periods (and any period filter) count from today, so the clock is read at request time, never in a prerender.
  await connection();
  const scope = filterConditions({ companyId: filters.companyId, clientId: filters.clientId, projectId: filters.projectId, currency });
  const months = RANGE_MONTHS[range];
  const now = new Date();
  const [y, m, d] = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
  const start = iso(new Date(Date.UTC(y, m - (months - 1), 1)));
  // The same stretch of days one range earlier, to compare what came in so far.
  const beforeStart = iso(new Date(Date.UTC(y, m - (2 * months - 1), 1)));
  const beforeEnd = iso(new Date(Date.UTC(y, m - months, d)));
  const buckets = Array.from({ length: months + MONTHS_AHEAD }, (_, index) => iso(new Date(Date.UTC(y, m - (months - 1) + index, 1))));
  const currentMonth = iso(new Date(Date.UTC(y, m, 1)));

  // Unpaid, sent invoices with what is still owed on them.
  const unpaid = sql`
    select i.id, coalesce(i.due_date, i.issue_date) as due,
      greatest(coalesce(t.total, 0) - coalesce(pa.paid, 0), 0) as balance
    from invoices i
    left join lateral (select sum(amount) as total from invoice_items where invoice_id = i.id) t on true
    left join lateral (select sum(amount) as paid from payments where invoice_id = i.id) pa on true
    where i.user_id = ${userId} and i.status = 'not_paid' ${scope}
  `;

  const [receivedRows, [before], [totals], scheduledRows, upcoming, recent] = await Promise.all([
    sql<{ month: string; amount: number }[]>`
      select to_char(date_trunc('month', p.paid_at at time zone 'UTC'), 'YYYY-MM-DD') as month, sum(p.amount)::float8 as amount
      from payments p join invoices i on i.id = p.invoice_id
      where p.user_id = ${userId} and p.paid_at >= ${start}::date and p.paid_at < current_date + 1 ${scope}
      group by 1
    `,
    sql<{ amount: number }[]>`
      select coalesce(sum(p.amount), 0)::float8 as amount
      from payments p join invoices i on i.id = p.invoice_id
      where p.user_id = ${userId} and p.paid_at >= ${beforeStart}::date and p.paid_at < ${beforeEnd}::date + 1 ${scope}
    `,
    sql<{ outstanding: number; outstandingCount: number; overdue: number; overdueCount: number; dueSoon: number; dueSoonCount: number }[]>`
      with unpaid as (${unpaid})
      select
        coalesce(sum(balance), 0)::float8 as outstanding,
        count(*) filter (where balance > 0)::int as outstanding_count,
        coalesce(sum(balance) filter (where due < current_date), 0)::float8 as overdue,
        count(*) filter (where balance > 0 and due < current_date)::int as overdue_count,
        coalesce(sum(balance) filter (where due between current_date and current_date + 30), 0)::float8 as due_soon,
        count(*) filter (where balance > 0 and due between current_date and current_date + 30)::int as due_soon_count
      from unpaid
    `,
    sql<{ month: string; amount: number }[]>`
      with unpaid as (${unpaid})
      select to_char(date_trunc('month', due), 'YYYY-MM-DD') as month, sum(balance)::float8 as amount
      from unpaid where balance > 0 and due >= current_date
      group by 1
    `,
    sql<UpcomingInvoice[]>`
      select i.id, i.number, i.title, coalesce(i.due_date, i.issue_date)::text as due_date,
        coalesce(i.due_date, i.issue_date) < current_date as overdue,
        (coalesce(t.total, 0) - coalesce(pa.paid, 0))::text as balance,
        coalesce(cl.name, i.client_name, '') as client_name, cl.company as client_company
      from invoices i
      left join clients cl on cl.id = i.client_id
      left join lateral (select sum(amount) as total from invoice_items where invoice_id = i.id) t on true
      left join lateral (select sum(amount) as paid from payments where invoice_id = i.id) pa on true
      where i.user_id = ${userId} and i.status = 'not_paid' and coalesce(t.total, 0) > coalesce(pa.paid, 0) ${scope}
      order by coalesce(i.due_date, i.issue_date), i.number
      limit 6
    `,
    sql<RecentPayment[]>`
      select p.id, p.amount::text as amount, p.paid_at::text as paid_at, p.source, m.name as method_name, p.note,
        i.id as invoice_id, i.number as invoice_number,
        coalesce(cl.name, i.client_name, '') as client_name, cl.company as client_company
      from payments p
      join invoices i on i.id = p.invoice_id
      left join clients cl on cl.id = i.client_id
      left join payment_methods m on m.id = p.method_id
      where p.user_id = ${userId} ${scope}
      order by p.paid_at desc, p.created_at desc
      limit 6
    `,
  ]);

  const received = new Map(receivedRows.map((row) => [row.month, row.amount]));
  const scheduled = new Map(scheduledRows.map((row) => [row.month, row.amount]));
  return {
    months: buckets.map((month) => ({
      month,
      received: month <= currentMonth ? (received.get(month) ?? 0) : 0,
      overdue: month === currentMonth ? totals.overdue : 0,
      scheduled: month >= currentMonth ? (scheduled.get(month) ?? 0) : 0,
    })),
    currentMonth,
    received: receivedRows.reduce((sum, row) => sum + row.amount, 0),
    receivedBefore: before.amount,
    ...totals,
    upcoming,
    recent,
  };
}
