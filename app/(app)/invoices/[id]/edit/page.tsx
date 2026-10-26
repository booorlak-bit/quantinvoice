import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { requireUser } from '@/lib/auth'
import { listClientOptions } from '@/lib/data/clients'
import { listCompanies } from '@/lib/data/companies'
import { getInvoice } from '@/lib/data/invoices'
import { listPaymentMethods } from '@/lib/data/payment-methods'

export const metadata: Metadata = { title: 'Edit invoice' }

export default async function EditInvoicePage({ params }: PageProps<'/invoices/[id]/edit'>) {
  const { id } = await params
  const user = await requireUser(`/invoices/${id}/edit`)
  const [invoice, companies, clients, methods] = await Promise.all([
    getInvoice(user.id, id),
    listCompanies(user.id),
    listClientOptions(user.id),
    listPaymentMethods(user.id),
  ])
  if (!invoice) notFound()

  return (
    <>
      <PageHeader crumbs={[{ label: 'Invoices', href: '/invoices' }, { label: invoice.number, href: `/invoices/${invoice.id}` }, { label: 'Edit' }]} />
      <PageBody title={`Edit ${invoice.number}`}>
        <InvoiceForm
          companies={companies.map((entry) => ({ id: entry.id, name: entry.name, defaultCurrency: entry.defaultCurrency }))}
          clients={clients}
          templates={[]}
          methods={methods}
          numberByCompany={{}}
          initial={{
            id: invoice.id,
            companyId: invoice.company.id,
            clientId: invoice.client.id,
            projectName: invoice.project?.name ?? '',
            templateId: invoice.templateId,
            number: invoice.number,
            slug: invoice.slug,
            title: invoice.title,
            status: invoice.status,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate ?? '',
            currency: invoice.currency,
            taxNote: invoice.taxNote,
            style: invoice.style,
            stripeLink: invoice.stripeLink ?? '',
            methodIds: invoice.methodIds,
            notes: invoice.notes,
            items: invoice.items.map((item) => ({ title: item.title, description: item.description ?? '', amount: item.amount ?? '' })),
          }}
        />
      </PageBody>
    </>
  )
}
