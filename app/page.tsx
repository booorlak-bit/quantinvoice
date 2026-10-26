import Form from "next/form";
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { BusinessLogo } from "@/components/BusinessLogo";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { getBusiness, listInvoices } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import type { InvoiceStatus, InvoiceSummary } from "@/lib/types";
import styles from "./page.module.css";

type Filters = { status?: InvoiceStatus; view: "list" | "grid"; q: string };

const STATUS_FILTERS: { label: string; status?: InvoiceStatus }[] = [
  { label: "All" },
  { label: "Paid", status: "paid" },
  { label: "Not Paid", status: "not_paid" },
];

function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const pick = (key: string) => (typeof params[key] === "string" ? params[key] : "");
  const status = pick("status");
  return {
    status: status === "paid" || status === "not_paid" ? status : undefined,
    view: pick("view") === "grid" ? "grid" : "list",
    q: pick("q").trim().slice(0, 100),
  };
}

function hrefWith(filters: Filters, patch: Partial<Filters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.status) params.set("status", next.status);
  if (next.view === "grid") params.set("view", "grid");
  if (next.q) params.set("q", next.q);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function InvoicesPage({ searchParams }: PageProps<"/">) {
  const filters = parseFilters(await searchParams);
  await requireAdmin(hrefWith(filters, {}));

  const [business, invoices] = await Promise.all([
    getBusiness(),
    listInvoices({ status: filters.status, query: filters.q }),
  ]);
  const tagline = business.tagline ?? "Invoice Manager";

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <BusinessLogo name={business.name} logoUrl={business.logoUrl} size="mark" />
          <span className={styles.brandText}>
            <span>{business.name}</span>
            <span className={styles.brandTagline}>{tagline}</span>
          </span>
        </Link>
        <Form action="/" className={styles.search} role="search">
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          {filters.view === "grid" && <input type="hidden" name="view" value="grid" />}
          <svg className={styles.searchIcon} viewBox="0 0 20 20" aria-hidden>
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input name="q" type="search" defaultValue={filters.q} placeholder="Search" aria-label="Search invoices" />
        </Form>
        <Link href="/admin/invoices/new" className={styles.newButton}>
          New Invoice
        </Link>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Invoices</h1>
        <div className={styles.toolbar}>
          <nav className={styles.segmented} aria-label="Filter by status">
            {STATUS_FILTERS.map(({ label, status }) => (
              <Link
                key={label}
                href={hrefWith(filters, { status })}
                className={filters.status === status ? styles.active : undefined}
                aria-current={filters.status === status ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <nav className={`${styles.segmented} ${styles.viewToggle}`} aria-label="Layout">
            {(["list", "grid"] as const).map((view) => (
              <Link
                key={view}
                href={hrefWith(filters, { view })}
                className={filters.view === view ? styles.active : undefined}
                aria-current={filters.view === view ? "page" : undefined}
              >
                {view === "list" ? "List" : "Grid"}
              </Link>
            ))}
          </nav>
        </div>

        {invoices.length === 0 ? (
          <div className={styles.empty}>
            <p>{filters.q || filters.status ? "No invoices match these filters." : "No invoices yet."}</p>
            <Link href="/admin/invoices/new" className={styles.newButton}>
              New Invoice
            </Link>
          </div>
        ) : (
          <>
            {filters.view === "list" && <InvoiceTable invoices={invoices} />}
            <InvoiceCards
              invoices={invoices}
              className={filters.view === "list" ? styles.mobileOnly : undefined}
            />
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <div>
          <p>{business.name}</p>
          <p className="muted">{tagline}</p>
        </div>
        <div className={styles.footerBottom}>
          <nav className={styles.footerNav}>
            <Link href="/admin/settings">Settings</Link>
            <form action={logout}>
              <button type="submit">Log out</button>
            </form>
          </nav>
          <p className="muted">©{new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}

function InvoiceTable({ invoices }: { invoices: InvoiceSummary[] }) {
  return (
    <div className={styles.table} role="table" aria-label="Invoices">
      <div className={styles.tableHead} role="row">
        <span role="columnheader">Invoice ID</span>
        <span role="columnheader">Title</span>
        <span role="columnheader">Client</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Issue Date</span>
        <span role="columnheader">Due Date</span>
        <span role="columnheader" className={styles.alignEnd}>
          Total
        </span>
      </div>
      {invoices.map((invoice) => (
        <Link key={invoice.id} href={`/invoices/${invoice.slug}`} className={styles.tableRow} role="row">
          <span role="cell">{invoice.number}</span>
          <span role="cell">{invoice.title}</span>
          <span role="cell">{invoice.clientName}</span>
          <span role="cell">
            <StatusBadge status={invoice.status} />
          </span>
          <span role="cell">{formatDate(invoice.issueDate)}</span>
          <span role="cell">{formatDate(invoice.dueDate)}</span>
          <span role="cell" className={styles.alignEnd}>
            {formatMoney(invoice.total, invoice.currency)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function InvoiceCards({ invoices, className }: { invoices: InvoiceSummary[]; className?: string }) {
  return (
    <ul className={className ? `${styles.cards} ${className}` : styles.cards}>
      {invoices.map((invoice) => (
        <li key={invoice.id}>
          <Link href={`/invoices/${invoice.slug}`} className={styles.card}>
            <span className={styles.cardTop}>
              <span>{invoice.number}</span>
              <StatusBadge status={invoice.status} />
            </span>
            <span className={styles.cardBody}>
              <span>{invoice.title}</span>
              <span className="muted">{invoice.clientName}</span>
              <span className={styles.cardTotal}>{formatMoney(invoice.total, invoice.currency)}</span>
              <span className="muted">Due {formatDate(invoice.dueDate)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
