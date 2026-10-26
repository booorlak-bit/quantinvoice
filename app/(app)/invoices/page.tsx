import type { Metadata } from 'next'
import Link from 'next/link'
import { IconPlusMedium } from 'central-icons'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { InvoicesView } from '@/components/invoices/invoices-view'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { listClientOptions } from '@/lib/data/clients'
import { listCompanies } from '@/lib/data/companies'
import { countByStatus, listCurrencies, listInvoices } from '@/lib/data/invoices'
import { parseFilters, parseSort, toSearchParams } from '@/lib/filters'
import { formatMoney } from '@/lib/format'

export const metadata: Metadata = { title: 'Invoices' }

export default async function InvoicesPage({ searchParams }: PageProps<'/invoices'>) {
  const params = await searchParams
  const filters = parseFilters(params)
  const sort = parseSort(params)
  const query = toSearchParams(filters, sort).toString()
  const user = await requireUser(query ? `/invoices?${query}` : '/invoices')

  const [invoices, counts, companies, clients, currencies] = await Promise.all([
    listInvoices(user.id, filters, sort),
    countByStatus(user.id, filters),
    listCompanies(user.id),
    listClientOptions(user.id),
    listCurrencies(user.id),
  ])

  // Outstanding per currency for the summary line, from the rows on screen.
  const outstanding = new Map<string, number>()
  for (const invoice of invoices) {
    if (invoice.status !== 'not_paid') continue
    const due = Number(invoice.total) - Number(invoice.paidTotal)
    outstanding.set(invoice.currency, (outstanding.get(invoice.currency) ?? 0) + due)
  }
  const outstandingText = [...outstanding].map(([currency, amount]) => formatMoney(amount, currency)).join(' + ')

  return (
    <>
      <PageHeader crumbs={[{ label: 'Invoices' }]} />
      <PageBody
        title="Invoices"
        description={`${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'}${outstandingText ? ` · ${outstandingText} outstanding` : ''}`}
        actions={
          <Button asChild>
            <Link href="/invoices/new">
              <IconPlusMedium />
              New invoice
            </Link>
          </Button>
        }
      >
        <InvoicesView
          invoices={invoices}
          counts={counts}
          filters={filters}
          sort={sort}
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
      </PageBody>
    </>
  )
}
