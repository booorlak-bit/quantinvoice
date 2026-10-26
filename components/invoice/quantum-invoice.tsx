import localFont from 'next/font/local'
import type { ReactNode } from 'react'

import { formatDate, formatMoney, sumItems } from '@/lib/format'
import type { Invoice } from '@/lib/types'
import styles from './quantum.module.css'

const switzer = localFont({ src: './fonts/Switzer-Regular.woff2', weight: '400', variable: '--font-switzer' })

const STATUS_TEXT = { draft: 'Draft', not_paid: 'Not Paid', overdue: 'Overdue', paid: 'Paid' } as const

/** The original Quantum (Framer) invoice, kept pixel-close to the template it was rebuilt from. */
export function QuantumInvoice({ invoice, payBar, topBarExtra }: { invoice: Invoice; payBar?: ReactNode; topBarExtra?: ReactNode }) {
  const subtotal = sumItems(invoice.items)
  const { company, client } = invoice
  const overdue = invoice.status === 'not_paid' && Boolean(invoice.dueDate && invoice.dueDate < new Date().toISOString().slice(0, 10))
  const badge = overdue ? 'overdue' : invoice.status

  return (
    <div className={`${styles.root} ${switzer.variable}`}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <p>
            Invoice <span className={styles.number}>{invoice.number}</span>
          </p>
          <div className={styles.topBarActions}>
            {topBarExtra}
            <span className={`${styles.badge} ${styles[`badge_${badge}`]}`}>{STATUS_TEXT[badge]}</span>
          </div>
        </div>
      </header>

      <main className={payBar ? `${styles.page} ${styles.withPayBar}` : styles.page}>
        <article className={styles.card}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.logoImage} src={company.logoUrl} alt={company.name} />
              ) : (
                <span className={styles.logoTile}>{company.name}</span>
              )}
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
                <dd>{client.company ?? client.name}</dd>
                {client.email && <dd>{client.email}</dd>}
              </div>
              <div>
                <dt>Invoice From</dt>
                <dd>{company.name}</dd>
                {company.email && <dd>{company.email}</dd>}
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
                  <p className={styles.itemAmount}>{item.amount === null ? 'Included' : formatMoney(item.amount, invoice.currency)}</p>
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

      {payBar && (
        <footer className={styles.payBar}>
          <div className={styles.payBarInner}>{payBar}</div>
        </footer>
      )}
    </div>
  )
}

export const quantumStyles = styles
