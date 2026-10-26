import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { InvoiceDocument, styleTheme } from '@/components/invoice/invoice-document'
import { PayBar } from '@/components/invoice/pay-bar'
import { QuantumInvoice, quantumStyles } from '@/components/invoice/quantum-invoice'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { getPublicInvoice, recordView } from '@/lib/data/invoices'
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
  const stripeLink = payable ? invoice.stripeLink : null

  if (invoice.style === 'quantum') {
    const payBar =
      payable && (contactEmail || stripeLink) ? (
        <>
          {contactEmail ? (
            <p className={quantumStyles.question}>
              <span className={quantumStyles.questionLabel}>Have a question?</span>
              <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Invoice ${invoice.number}`)}`}>Get in Touch</a>
            </p>
          ) : (
            <span />
          )}
          {stripeLink && (
            <a className={quantumStyles.payButton} href={stripeLink} target="_blank" rel="noopener noreferrer">
              Pay with Stripe
            </a>
          )}
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
    <div data-theme={theme['data-theme']} className={cn(theme.className, 'min-h-svh bg-background text-foreground')}>
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
          {stripeLink && (
            <Button asChild>
              <a href={stripeLink} target="_blank" rel="noopener noreferrer">
                Pay with Stripe
              </a>
            </Button>
          )}
        </PayBar>
      )}
    </div>
  )
}
