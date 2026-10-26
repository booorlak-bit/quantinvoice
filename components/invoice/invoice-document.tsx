import type { ReactNode } from 'react'

import { InvoiceStatusBadge } from '@/components/invoices/status-badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatMoney, sumItems } from '@/lib/format'
import type { Invoice, InvoiceStyle } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Theme attributes for an OSDS invoice style: a theme island that does not depend on the page around it. */
export function styleTheme(style: InvoiceStyle) {
  return {
    'data-theme': style === 'alt-light' || style === 'alt-dark' ? 'alt' : 'osds',
    className: style === 'dark' || style === 'alt-dark' ? 'dark' : 'light',
  }
}

function CompanyMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    // Logos are arbitrary user-provided URLs, so next/image remote patterns cannot cover them.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="size-12 rounded-lg object-cover" />
  }
  return (
    <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="flex flex-col text-sm font-medium break-words text-foreground">{children}</dd>
    </div>
  )
}

/**
 * The invoice as clients see it, in OSDS. Renders inside its own theme island so it can be previewed in the admin
 * and shown on the public page with the same markup. `footer` is the pay bar on the public page.
 */
export function InvoiceDocument({ invoice, footer, className }: { invoice: Invoice; footer?: ReactNode; className?: string }) {
  const total = sumItems(invoice.items)
  const balance = Math.max(Number(total) - Number(invoice.paidTotal), 0)
  const partlyPaid = Number(invoice.paidTotal) > 0 && invoice.status !== 'paid'
  const overdue = invoice.status === 'not_paid' && Boolean(invoice.dueDate && invoice.dueDate < new Date().toISOString().slice(0, 10))
  const { company, client } = invoice

  return (
    <article className={cn('mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-10', className)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CompanyMark name={company.name} logoUrl={company.logoUrl} />
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground">{company.name}</span>
            {company.tagline && <span className="text-sm text-muted-foreground">{company.tagline}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-sm text-muted-foreground">
            Invoice <span className="font-mono text-foreground">{invoice.number}</span>
          </span>
          <InvoiceStatusBadge status={invoice.status} overdue={overdue} />
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <h1 className="text-heading-lg text-foreground">{invoice.title}</h1>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <Meta label="Issued">{formatDate(invoice.issueDate)}</Meta>
          <Meta label="Due">
            <span className={cn(overdue && 'text-destructive')}>{formatDate(invoice.dueDate)}</span>
          </Meta>
          <Meta label="Bill to">
            <span>{client.company ?? client.name}</span>
            {client.company && <span className="font-normal text-muted-foreground">{client.name}</span>}
            {client.email && <span className="font-normal text-muted-foreground">{client.email}</span>}
            {client.address && <span className="font-normal whitespace-pre-line text-muted-foreground">{client.address}</span>}
          </Meta>
          <Meta label="From">
            <span>{company.name}</span>
            {company.email && <span className="font-normal text-muted-foreground">{company.email}</span>}
            {company.address && <span className="font-normal whitespace-pre-line text-muted-foreground">{company.address}</span>}
            {company.taxId && <span className="font-normal text-muted-foreground">Tax ID {company.taxId}</span>}
          </Meta>
          {invoice.project && <Meta label="Project">{invoice.project.name}</Meta>}
        </dl>
      </div>

      <section aria-label="Line items" className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-medium text-muted-foreground">
          <span>Item</span>
          <span>Amount</span>
        </div>
        <ul className="flex flex-col">
          {invoice.items.map((item, index) => (
            <li key={index} className="flex items-start justify-between gap-6 border-b border-border py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                {item.description && <span className="text-sm text-muted-foreground">{item.description}</span>}
              </div>
              <span className={cn('shrink-0 text-sm font-medium tabular-nums', item.amount === null ? 'text-muted-foreground' : 'text-foreground')}>
                {item.amount === null ? 'Included' : formatMoney(item.amount, invoice.currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="ml-auto flex w-full max-w-xs flex-col gap-2 pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium tabular-nums">{formatMoney(total, invoice.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="text-right font-medium">{invoice.taxNote}</dd>
          </div>
          <Separator className="my-1" />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="flex items-center gap-2 font-medium">
              Total
              <span className="rounded-sm border border-border px-1.5 text-xs text-muted-foreground">{invoice.currency}</span>
            </dt>
            <dd className="text-2xl font-semibold tabular-nums">{formatMoney(total, invoice.currency)}</dd>
          </div>
          {partlyPaid && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="font-medium tabular-nums">−{formatMoney(invoice.paidTotal, invoice.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium">Balance due</dt>
                <dd className="font-semibold tabular-nums">{formatMoney(balance, invoice.currency)}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      {invoice.notes.length > 0 && (
        <section aria-label="Notes" className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
          {invoice.notes.map((note, index) => (
            <div key={index} className="flex flex-col gap-1">
              <h2 className="text-sm font-medium text-foreground">{note.title}</h2>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{note.body}</p>
            </div>
          ))}
        </section>
      )}

      {footer}
    </article>
  )
}
