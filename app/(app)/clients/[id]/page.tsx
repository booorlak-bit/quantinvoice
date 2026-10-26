import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconPlusMedium } from 'central-icons'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { ClientEditor, ProjectsCard } from '@/components/clients/client-editor'
import { InvoiceStatusBadge } from '@/components/invoices/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requireUser } from '@/lib/auth'
import { getClient } from '@/lib/data/clients'
import { listInvoices } from '@/lib/data/invoices'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Client' }

export default async function ClientPage({ params }: PageProps<'/clients/[id]'>) {
  const { id } = await params
  const user = await requireUser(`/clients/${id}`)
  const client = await getClient(user.id, id)
  if (!client) notFound()
  const invoices = await listInvoices(user.id, { clientId: client.id }, { key: 'issue', dir: 'desc' })
  const overdue = invoices.filter((invoice) => invoice.overdue)
  const title = client.company ?? client.name

  return (
    <>
      <PageHeader crumbs={[{ label: 'Clients', href: '/clients' }, { label: title }]} />
      <PageBody
        title={title}
        description={client.company ? client.name : client.email ?? undefined}
        actions={
          <Button asChild>
            <Link href={`/invoices/new?client=${client.id}`}>
              <IconPlusMedium />
              New invoice
            </Link>
          </Button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-5">
            <ClientEditor client={client} hasInvoices={client.invoiceCount > 0} />
            <ProjectsCard clientId={client.id} projects={client.projects} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Finances</CardTitle>
              <CardDescription>Drafts are not counted.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {client.totals.length === 0 && <p className="text-sm text-muted-foreground">No sent invoices yet.</p>}
              {client.totals.map((total) => (
                <dl key={total.currency} className="flex flex-col gap-2 text-sm">
                  {client.totals.length > 1 && <span className="text-xs font-medium text-muted-foreground">{total.currency}</span>}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Invoiced</dt>
                    <dd className="font-medium tabular-nums">{formatMoney(total.invoiced, total.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Paid</dt>
                    <dd className="font-medium tabular-nums">{formatMoney(total.paid, total.currency)}</dd>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium">Outstanding</dt>
                    <dd className="text-lg font-semibold tabular-nums">{formatMoney(total.outstanding, total.currency)}</dd>
                  </div>
                </dl>
              ))}
              {overdue.length > 0 && (
                <p className="text-sm font-medium text-destructive">
                  {overdue.length} overdue {overdue.length === 1 ? 'invoice' : 'invoices'}
                </p>
              )}
              <Separator />
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Invoices</dt>
                  <dd className="font-medium tabular-nums">{client.invoiceCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Client since</dt>
                  <dd className="font-medium tabular-nums">{formatDate(client.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">Invoices</h2>
          {invoices.length === 0 ? (
            <Empty className="border border-dashed border-border">
              <EmptyHeader>
                <EmptyTitle>No invoices for this client</EmptyTitle>
                <EmptyDescription>Create one to start billing them.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-lg border border-border px-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Invoice</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Due</TableHead>
                    <TableHead align="right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-muted-foreground">{invoice.number}</TableCell>
                      <TableCell className="max-w-56 truncate">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.title}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{invoice.projectName ?? '—'}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} overdue={invoice.overdue} />
                      </TableCell>
                      <TableCell className={cn('hidden tabular-nums sm:table-cell', invoice.overdue ? 'text-destructive' : 'text-muted-foreground')}>
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell align="right" className="tabular-nums">
                        {formatMoney(invoice.total, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </PageBody>
    </>
  )
}
