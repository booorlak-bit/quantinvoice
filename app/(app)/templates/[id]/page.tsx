import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { TemplateForm } from '@/components/templates/template-form'
import { requireUser } from '@/lib/auth'
import { getTemplate, listTemplates } from '@/lib/data/templates'

export const metadata: Metadata = { title: 'Edit template' }

export default async function EditTemplatePage({ params }: PageProps<'/templates/[id]'>) {
  const { id } = await params
  const user = await requireUser(`/templates/${id}`)
  const [template, templates] = await Promise.all([getTemplate(user.id, id), listTemplates(user.id)])
  if (!template) notFound()
  return (
    <>
      <PageHeader crumbs={[{ label: 'Templates', href: '/templates' }, { label: template.name }]} />
      <PageBody title={`Edit ${template.name}`}>
        <TemplateForm
          serviceTypes={[...new Set(templates.flatMap((entry) => (entry.serviceType ? [entry.serviceType] : [])))]}
          initial={{
            id: template.id,
            name: template.name,
            serviceType: template.serviceType ?? '',
            description: template.description ?? '',
            style: template.style,
            currency: template.currency ?? '',
            items: template.items,
            notes: template.notes,
          }}
        />
      </PageBody>
    </>
  )
}
