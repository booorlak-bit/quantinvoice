import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { requireUser } from '@/lib/auth'
import { listClientOptions } from '@/lib/data/clients'
import { listCompanies } from '@/lib/data/companies'
import { suggestInvoiceNumber } from '@/lib/data/invoices'
import { listPaymentMethods } from '@/lib/data/payment-methods'
import { listTemplates } from '@/lib/data/templates'
import { addDaysIso, todayIso } from '@/lib/format'

export const metadata: Metadata = { title: 'New invoice' }

export default async function NewInvoicePage({ searchParams }: PageProps<'/invoices/new'>) {
  const user = await requireUser('/invoices/new')
  const params = await searchParams
  const [companies, clients, templates, methods] = await Promise.all([
    listCompanies(user.id),
    listClientOptions(user.id),
    listTemplates(user.id),
    listPaymentMethods(user.id),
  ])
  if (companies.length === 0) redirect('/settings?company=new')

  const company = companies.find((entry) => entry.isDefault) ?? companies[0]
  const numbers = Object.fromEntries(
    await Promise.all(companies.map(async (entry) => [entry.id, await suggestInvoiceNumber(user.id, entry.invoicePrefix)] as const)),
  )
  const presetClient = typeof params.client === 'string' && clients.some((client) => client.id === params.client) ? params.client : null
  const presetTemplate = typeof params.template === 'string' ? templates.find((template) => template.id === params.template) : undefined
  const today = todayIso()

  return (
    <>
      <PageHeader crumbs={[{ label: 'Invoices', href: '/invoices' }, { label: 'New invoice' }]} />
      <PageBody title="New invoice">
        <InvoiceForm
          companies={companies.map((entry) => ({ id: entry.id, name: entry.name, defaultCurrency: entry.defaultCurrency }))}
          clients={clients}
          templates={templates}
          methods={methods}
          numberByCompany={numbers}
          initial={{
            companyId: company.id,
            clientId: presetClient,
            projectName: '',
            templateId: presetTemplate?.id ?? null,
            number: numbers[company.id],
            slug: '',
            title: presetTemplate?.name ?? '',
            status: 'draft',
            issueDate: today,
            dueDate: addDaysIso(today, 14),
            currency: presetTemplate?.currency ?? company.defaultCurrency,
            taxNote: 'Calculated at checkout',
            style: presetTemplate?.style ?? 'light',
            stripeLink: '',
            methodIds: methods.filter((method) => method.isDefault).map((method) => method.id),
            notes: presetTemplate?.notes ?? company.defaultNotes,
            items: (presetTemplate?.items ?? []).map((item) => ({ title: item.title, description: item.description ?? '', amount: item.amount ?? '' })),
          }}
        />
      </PageBody>
    </>
  )
}
