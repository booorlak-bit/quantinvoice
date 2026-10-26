import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { InvoiceDocument, styleTheme } from '@/components/invoice/invoice-document'
import { PayBar } from '@/components/invoice/pay-bar'
import { PayDialog, type PayOption } from '@/components/invoice/pay-dialog'
import { QuantumInvoice, quantumStyles } from '@/components/invoice/quantum-invoice'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { getPublicInvoice, recordView } from '@/lib/data/invoices'
import { formatMoney, sumItems } from '@/lib/format'
import { getPayOptions } from '@/lib/pay-options'
import { cn } from '@/lib/utils'

async function load(slug: string) {
  const [invoice, viewer] = await Promise.all([getPublicInvoice(slug), getCurrentUser()])
  const isOwner = Boolean(invoice && viewer && viewer.id === invoice.userId)
  // Drafts are visible to their owner only.
  if (!invoice || (invoice.status === 'draft' && !isOwner)) return null
  return { invoice, isOwner }
}

export async function generateMetadata({ params }: PageProps<'/i/[slug]'>): Promise<Metadata> {
  const loaded = await load((await params).slug)
  return { title: loaded ? { absolute: `${loaded.invoice.title} · ${loaded.invoice.company.name}` } : 'Invoice' }
}

export default async function PublicInvoicePage({ params }: PageProps<'/i/[slug]'>) {
  const loaded = await load((await params).slug)
  if (!loaded) notFound()
  const { invoice, isOwner } = loaded
  if (!isOwner) await recordView(invoice.id, invoice.userId)

  const contactEmail = invoice.company.contactEmail ?? invoice.company.email
  const payable = invoice.status !== 'paid'
  const options = payable ? await getPayOptions(invoice) : []
  const amount = formatMoney(Math.max(Number(sumItems(invoice.items)) - Number(invoice.paidTotal), 0), invoice.currency)

  if (invoice.style === 'quantum') {
    const payBar =
      payable && (contactEmail || options.length) ? (
        <>
          {contactEmail ? (
            <p className={quantumStyles.question}>
              <span className={quantumStyles.questionLabel}>Have a question?</span>
              <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Invoice ${invoice.number}`)}`}>Get in Touch</a>
            </p>
          ) : (
            <span />
          )}
          <PayAction options={options} amount={amount} invoiceNumber={invoice.number} className={quantumStyles.payButton} />
        </>
      ) : undefined
    return (
      <QuantumInvoice
        invoice={invoice}
        payBar={payBar}
        topBarExtra={isOwner ? <Link className={quantumStyles.editLink} href={`/invoices/${invoice.id}`}>Open in app</Link> : undefined}
      />
    )
  }

  const theme = styleTheme(invoice.style)
  return (
    <div id="invoice-page" data-theme={theme['data-theme']} className={cn(theme.className, 'min-h-svh bg-background text-foreground')}>
      <div className={cn('px-4 py-6 sm:py-12', payable && 'pb-32')}>
        {isOwner && (
          <div className="mx-auto mb-4 flex max-w-3xl justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href={`/invoices/${invoice.id}`}>Open in app</Link>
            </Button>
          </div>
        )}
        <InvoiceDocument invoice={invoice} />
      </div>
      {payable && (
        <PayBar contactEmail={contactEmail} invoiceNumber={invoice.number}>
          {options.length > 0 && <PayAction options={options} amount={amount} invoiceNumber={invoice.number} />}
        </PayBar>
      )}
    </div>
  )
}

/** One link straight to the payment page when that is the only way to pay; otherwise a dialog with every method. */
function PayAction({ options, amount, invoiceNumber, className }: { options: PayOption[]; amount: string; invoiceNumber: string; className?: string }) {
  if (options.length === 0) return null
  const [only] = options
  if (options.length === 1 && (only.type === 'stripe' || only.type === 'link')) {
    const label = only.type === 'stripe' ? `Pay ${amount}` : only.details.label
    return className ? (
      <a className={className} href={only.details.url} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    ) : (
      <Button asChild>
        <a href={only.details.url} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      </Button>
    )
  }
  return (
    <PayDialog
      options={options}
      amount={amount}
      invoiceNumber={invoiceNumber}
      trigger={className ? <button type="button" className={className}>Pay {amount}</button> : <Button>Pay {amount}</Button>}
    />
  )
}
