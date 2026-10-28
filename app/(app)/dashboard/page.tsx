import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCalendarClock,
  IconExclamationTriangle,
  IconPlusMedium,
  IconReceiptBill,
  IconWallet1,
} from 'central-icons'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { DashboardFilters } from '@/components/dashboard/dashboard-filters'
import { PaymentsChart } from '@/components/dashboard/payments-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { requireUser } from '@/lib/auth'
import { listClientOptions } from '@/lib/data/clients'
import { listCompanies } from '@/lib/data/companies'
import { getDashboard, parseRange, RANGE_MONTHS, type RecentPayment, type UpcomingInvoice } from '@/lib/data/dashboard'
import { listCurrencies } from '@/lib/data/invoices'
import { parseFilters, toSearchParams } from '@/lib/filters'
import { formatDate, formatMoney } from '@/lib/format'
import type { StatusFilter } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

// Every number depends on the session, the filters in the URL and the database. A navigation here waits for them and
// keeps the previous render on screen (the filters dim it), rather than showing a loading state.
export const instant = false

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export default async function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  const params = await searchParams
  const filters = parseFilters(params)
  const range = parseRange(params.range)
  const query = toSearchParams(filters)
  if (range !== '6m') query.set('range', range)
  const user = await requireUser(query.size ? `/dashboard?${query}` : '/dashboard')

  const [companies, clients, currencies] = await Promise.all([listCompanies(user.id), listClientOptions(user.id), listCurrencies(user.id)])

  if (currencies.length === 0) {
    return (
      <>
        <PageHeader crumbs={[{ label: 'Dashboard' }]} />
        <PageBody title="Dashboard">
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconReceiptBill />
              </EmptyMedia>
              <EmptyTitle>No invoices yet</EmptyTitle>
              <EmptyDescription>Payments and upcoming income show up here once you send your first invoice.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/invoices/new">
                  <IconPlusMedium />
                  New invoice
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </PageBody>
      </>
    )
  }

  // Amounts in different currencies can't be added, so the dashboard shows one at a time.
  const preferred = companies.find((company) => company.isDefault)?.defaultCurrency
  const currency =
    filters.currency && currencies.includes(filters.currency)
      ? filters.currency
      : preferred && currencies.includes(preferred)
        ? preferred
        : currencies[0]
  const data = await getDashboard(user.id, filters, currency, range)
  const months = RANGE_MONTHS[range]
  const money = (amount: number) => formatMoney(amount, currency)
  const change = data.receivedBefore > 0 ? ((data.received - data.receivedBefore) / data.receivedBefore) * 100 : null

  // Links into the invoice list keep the same filters.
  const invoicesLink = (status: StatusFilter) => `/invoices?${toSearchParams({ ...filters, currency, status })}`

  return (
    <>
      <PageHeader crumbs={[{ label: 'Dashboard' }]} />
      <PageBody
        title="Dashboard"
        description={`Amounts in ${currency}`}
        actions={
          <Button asChild>
            <Link href="/invoices/new">
              <IconPlusMedium />
              New invoice
            </Link>
          </Button>
        }
      >
        <DashboardFilters
          filters={filters}
          currency={currency}
          range={range}
          options={{
            companies: companies.map((company) => ({ id: company.id, name: company.name })),
            clients: clients.map((client) => ({
              id: client.id,
              name: client.name,
              company: client.company,
              projects: client.projects.map((project) => ({ id: project.id, name: project.name })),
            })),
            currencies,
          }}
        />

        <div className="flex flex-col gap-5 transition-opacity peer-aria-busy:opacity-60">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Received" icon={<IconWallet1 />} value={money(data.received)}>
              {change !== null && (
                <Badge color={change >= 0 ? 'green' : 'red'}>
                  {change >= 0 ? <IconArrowUpRight aria-hidden="true" /> : <IconArrowDownRight aria-hidden="true" />}
                  <span className="sr-only">{change >= 0 ? 'Up' : 'Down'}</span>
                  {Math.abs(change).toFixed(0)}%
                </Badge>
              )}
              last {months} months
            </StatTile>
            <StatTile label="Outstanding" icon={<IconReceiptBill />} value={money(data.outstanding)} href={invoicesLink('not_paid')}>
              {plural(data.outstandingCount, 'unpaid invoice')}
            </StatTile>
            <StatTile label="Overdue" icon={<IconExclamationTriangle />} value={money(data.overdue)} href={invoicesLink('overdue')}>
              {data.overdueCount > 0 ? (
                <Badge color="red">{plural(data.overdueCount, 'invoice')}</Badge>
              ) : (
                'Nothing late'
              )}
            </StatTile>
            <StatTile label="Due in 30 days" icon={<IconCalendarClock />} value={money(data.dueSoon)}>
              {plural(data.dueSoonCount, 'invoice')}
            </StatTile>
          </div>

          <PaymentsChart months={data.months} currentMonth={data.currentMonth} currency={currency} received={data.received} historyMonths={months} />

          <div className="grid gap-5 lg:grid-cols-2">
            <UpcomingCard invoices={data.upcoming} currency={currency} href={invoicesLink('not_paid')} />
            <RecentCard payments={data.recent} currency={currency} />
          </div>
        </div>
      </PageBody>
    </>
  )
}

function StatTile({ label, icon, value, href, children }: { label: string; icon: ReactNode; value: string; href?: string; children: ReactNode }) {
  const body = (
    <Card className={cn('h-full gap-3 p-4', href && 'transition-colors group-hover:bg-muted/50')}>
      <div className="flex items-center justify-between gap-2 text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
        <span className="truncate text-sm font-medium">{label}</span>
        {icon}
      </div>
      <span className="truncate text-2xl leading-none font-semibold text-foreground">{value}</span>
      <span className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">{children}</span>
    </Card>
  )
  if (!href) return body
  return (
    <Link href={href} className="group rounded-xl outline-none focus-visible:shadow-focus">
      {body}
    </Link>
  )
}

const clientLabel = (row: { clientName: string; clientCompany: string | null }) => row.clientCompany ?? row.clientName

function UpcomingCard({ invoices, currency, href }: { invoices: UpcomingInvoice[]; currency: string; href: string }) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>Upcoming payments</CardTitle>
        <CardDescription>Unpaid invoices, soonest due first</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href={href}>View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing to collect. Every sent invoice is paid.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 outline-none hover:bg-muted/50 focus-visible:shadow-focus"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{clientLabel(invoice)}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{invoice.number}</span> · {invoice.title}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium text-foreground tabular-nums">{formatMoney(invoice.balance, currency)}</span>
                    {invoice.overdue ? (
                      <Badge color="red">Overdue · {formatDate(invoice.dueDate, { short: true })}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground tabular-nums">Due {formatDate(invoice.dueDate, { short: true })}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function RecentCard({ payments, currency }: { payments: RecentPayment[]; currency: string }) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>Recent payments</CardTitle>
        <CardDescription>The latest money in</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {payments.map((payment) => (
              <li key={payment.id}>
                <Link
                  href={`/invoices/${payment.invoiceId}`}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 outline-none hover:bg-muted/50 focus-visible:shadow-focus"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{clientLabel(payment)}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{payment.invoiceNumber}</span> ·{' '}
                      {payment.source === 'stripe' ? 'Stripe' : (payment.methodName ?? payment.note ?? 'Recorded manually')}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium text-foreground tabular-nums">+{formatMoney(payment.amount, currency)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatDate(payment.paidAt, { short: true })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
