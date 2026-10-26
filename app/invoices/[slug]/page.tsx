import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessLogo } from "@/components/BusinessLogo";
import { StatusBadge } from "@/components/StatusBadge";
import { isAdmin } from "@/lib/auth";
import { getBusiness, getInvoiceBySlug } from "@/lib/data";
import { formatDate, formatMoney, sumItems } from "@/lib/format";
import styles from "./page.module.css";

// Drafts are only visible to a signed-in admin; everyone else gets a 404.
async function loadInvoice(slug: string) {
  const [invoice, business, admin] = await Promise.all([getInvoiceBySlug(slug), getBusiness(), isAdmin()]);
  if (!invoice || (invoice.status === "draft" && !admin)) return { invoice: null, business, admin };
  return { invoice, business, admin };
}

export async function generateMetadata({ params }: PageProps<"/invoices/[slug]">): Promise<Metadata> {
  const { invoice, business } = await loadInvoice((await params).slug);
  return { title: invoice ? `${invoice.title} | ${business.name}` : business.name };
}

export default async function InvoicePage({ params }: PageProps<"/invoices/[slug]">) {
  const { invoice, business, admin } = await loadInvoice((await params).slug);
  if (!invoice) notFound();

  const subtotal = sumItems(invoice.items);
  const contactEmail = business.contactEmail ?? business.email;
  const showPayBar = invoice.status !== "paid" && Boolean(contactEmail || invoice.paymentUrl);

  return (
    <>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <p>
            Invoice <span className={styles.number}>{invoice.number}</span>
          </p>
          <div className={styles.topBarActions}>
            {admin && (
              <Link className={styles.editLink} href={`/admin/invoices/${invoice.id}`}>
                Edit
              </Link>
            )}
            <StatusBadge status={invoice.status} />
          </div>
        </div>
      </header>

      <main className={showPayBar ? `${styles.page} ${styles.withPayBar}` : styles.page}>
        <article className={styles.card}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <BusinessLogo name={business.name} logoUrl={business.logoUrl} size="large" />
              <h1 className={styles.title}>{invoice.title}</h1>
            </div>
            <dl className={styles.meta}>
              <div>
                <dt>Issue Date</dt>
                <dd>{formatDate(invoice.issueDate)}</dd>
              </div>
              <div>
                <dt>Due Date</dt>
                <dd>{formatDate(invoice.dueDate)}</dd>
              </div>
              <div>
                <dt>Invoice For</dt>
                <dd>{invoice.clientName}</dd>
                {invoice.clientEmail && <dd>{invoice.clientEmail}</dd>}
              </div>
              <div>
                <dt>Invoice From</dt>
                <dd>{business.name}</dd>
                {business.email && <dd>{business.email}</dd>}
              </div>
            </dl>
          </section>

          <section className={styles.breakdown} aria-label="Breakdown">
            <div className={styles.breakdownHead} aria-hidden>
              <span>Breakdown</span>
              <span>Total</span>
            </div>
            <ul className={styles.items}>
              {invoice.items.map((item, index) => (
                <li key={index} className={styles.item}>
                  <div>
                    <p>{item.title}</p>
                    {item.description && <p className={styles.itemDescription}>{item.description}</p>}
                  </div>
                  <p className={styles.itemAmount}>
                    {item.amount === null ? "Included" : formatMoney(item.amount, invoice.currency)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.totals} aria-label="Totals">
            <dl className={styles.totalsList}>
              <div className={styles.totalsRow}>
                <dt>Sub Total</dt>
                <dd>{formatMoney(subtotal, invoice.currency)}</dd>
              </div>
              <div className={styles.totalsRow}>
                <dt>Tax</dt>
                <dd>{invoice.taxNote}</dd>
              </div>
              <div className={styles.grandTotal}>
                <dt>
                  Total <span className={styles.currency}>{invoice.currency}</span>
                </dt>
                <dd>{formatMoney(subtotal, invoice.currency)}</dd>
              </div>
            </dl>
          </section>
        </article>

        {invoice.notes.length > 0 && (
          <section className={styles.notes}>
            <h2 className={styles.notesTitle}>Notes</h2>
            <div className={styles.notesGrid}>
              {invoice.notes.map((note, index) => (
                <div key={index}>
                  <h3 className={styles.noteTitle}>{note.title}</h3>
                  <p className={styles.noteBody}>{note.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {showPayBar && (
        <footer className={styles.payBar}>
          <div className={styles.payBarInner}>
            {contactEmail ? (
              <p className={styles.question}>
                <span className={styles.questionLabel}>Have a question?</span>
                <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Invoice ${invoice.number}`)}`}>
                  Get in Touch
                </a>
              </p>
            ) : (
              <span />
            )}
            {invoice.paymentUrl && (
              <a className={styles.payButton} href={invoice.paymentUrl} target="_blank" rel="noopener noreferrer">
                {invoice.paymentLabel}
              </a>
            )}
          </div>
        </footer>
      )}
    </>
  );
}
