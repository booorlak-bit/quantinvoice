import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { IconCircleCheck, IconEyeOpen, IconDollar, IconFileText, IconPaperPlaneTopRight, IconClock } from 'central-icons'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { InvoiceDocument, styleTheme } from '@/components/invoice/invoice-document'
import { QuantumInvoice } from '@/components/invoice/quantum-invoice'
import { CopyLinkButton, DeletePaymentButton, InvoiceActions } from '@/components/invoices/invoice-actions'
import { InvoiceStatusBadge } from '@/components/invoices/status-badge'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { requireUser } from '@/lib/auth'
import { isUuid } from '@/lib/data/clients'
import { getInvoice, listEvents, listPayments, type InvoiceEvent } from '@/lib/data/invoices'
import { formatDate, formatMoney, sumItems } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Invoice' }

const EVENT_TEXT: Record<string, { label: (detail: Record<string, unknown>) => string; icon: typeof IconFileText }> = {
  created: { label: () => 'Created', icon: IconFileText },
  sent: { label: (detail) => `Sent to ${String(detail.to ?? 'the client')}`, icon: IconPaperPlaneTopRight },
  viewed: { label: () => 'Viewed by the client', icon: IconEyeOpen },
  payment: { label: () => 'Payment recorded', icon: IconDollar },
  paid: { label: () => 'Paid', icon: IconCircleCheck },
  status: {
    label: (detail) => `Status set to ${detail.status === 'not_paid' ? 'unpaid' : String(detail.status)}`,
    icon: IconClock,
  },
}

function eventTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export default async function InvoicePage({ params, searchParams }: PageProps<'/invoices/[id]'>) {
  const { id } = await params
  // Links from the first release used /invoices/<slug> for the client page.
  if (!isUuid(id)) redirect(`/i/${id}`)
  const user = await requireUser(`/invoices/${id}`)
  const [invoice, payments, events] = await Promise.all([getInvoice(user.id, id), listPayments(user.id, id), listEvents(user.id, id)])
  if (!invoice) notFound()
  const created = (await searchParams).created === '1'

  const total = sumItems(invoice.items)
  const balance = Math.max(Number(total) - Number(invoice.paidTotal), 0).toFixed(2)
  const overdue = invoice.status === 'not_paid' && Boolean(invoice.dueDate && invoice.dueDate < new Date().toISOString().slice(0, 10))
  const theme = styleTheme(invoice.style)

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Invoices', href: '/invoices' }, { label: invoice.number }]}
        actions={
          <InvoiceActions
            invoice={{ id: invoice.id, slug: invoice.slug, number: invoice.number, status: invoice.status, currency: invoice.currency, balance }}
          />
        }
      />
      <PageBody
        title={invoice.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <InvoiceStatusBadge status={invoice.status} overdue={overdue} />
            <span>
              {invoice.number} · {invoice.client.company ?? invoice.client.name} · {formatMoney(total, invoice.currency)}
            </span>
          </span>
        }
      >
        {created && (
          <Alert variant="success">
            <IconCircleCheck />
            <AlertTitle>Invoice created</AlertTitle>
            <AlertDescription>
              {invoice.status === 'draft'
                ? 'It is a draft, so only you can open its page. Mark it as sent when you share it.'
                : 'Share the link with your client.'}
            </AlertDescription>
            <AlertAction>
              <CopyLinkButton slug={invoice.slug} />
            </AlertAction>
          </Alert>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          <div className="min-w-0 overflow-hidden rounded-xl bg-muted p-2 sm:p-3">
            {invoice.style === 'quantum' ? (
              <div className="max-h-[56rem] overflow-y-auto rounded-lg">
                <QuantumInvoice invoice={invoice} />
              </div>
            ) : (
              <div data-theme={theme['data-theme']} className={theme.className}>
                <InvoiceDocument invoice={invoice} className="max-w-none border-0 shadow-sm" />
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="font-medium tabular-nums">{formatMoney(total, invoice.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Paid</dt>
                    <dd className="font-medium tabular-nums">{formatMoney(invoice.paidTotal, invoice.currency)}</dd>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium">Balance due</dt>
                    <dd className="font-semibold tabular-nums">{formatMoney(balance, invoice.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Due</dt>
                    <dd className={cn('font-medium tabular-nums', overdue && 'text-destructive')}>{formatDate(invoice.dueDate)}</dd>
                  </div>
                  {invoice.project && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Project</dt>
                      <dd className="truncate font-medium">{invoice.project.name}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">From</dt>
                    <dd className="truncate font-medium">{invoice.company.name}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <Link href={`/clients/${invoice.client.id}`} className="font-medium text-foreground hover:underline">
                  {invoice.client.company ?? invoice.client.name}
                </Link>
                {invoice.client.company && <span className="text-muted-foreground">{invoice.client.name}</span>}
                {invoice.client.email && <span className="text-muted-foreground">{invoice.client.email}</span>}
                {invoice.client.phone && <span className="text-muted-foreground">{invoice.client.phone}</span>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {payments.length === 0 && <p className="text-muted-foreground">No payments yet.</p>}
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium tabular-nums">{formatMoney(payment.amount, payment.currency)}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {formatDate(payment.paidAt)} · {payment.source === 'stripe' ? 'Stripe' : (payment.methodName ?? payment.note ?? 'Manual')}
                      </span>
                    </div>
                    {payment.source === 'manual' && <DeletePaymentButton paymentId={payment.id} />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={events} />
              </CardContent>
            </Card>

            <Button asChild variant="outline">
              <a href={`/i/${invoice.slug}`} target="_blank" rel="noopener noreferrer">
                Open client page
              </a>
            </Button>
          </aside>
        </div>
      </PageBody>
    </>
  )
}

function Timeline({ events }: { events: InvoiceEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">Nothing yet.</p>
  return (
    <ol className="flex flex-col gap-3">
      {events.map((event) => {
        const look = EVENT_TEXT[event.type] ?? EVENT_TEXT.created
        return (
          <li key={event.id} className="flex items-start gap-2.5 text-sm">
            <look.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-col">
              <span className="font-medium text-foreground">{look.label(event.detail)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{eventTime(event.createdAt)}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
