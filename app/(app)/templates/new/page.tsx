import type { Metadata } from 'next'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { TemplateForm } from '@/components/templates/template-form'
import { requireUser } from '@/lib/auth'
import { getDefaultCompany } from '@/lib/data/companies'
import { listTemplates } from '@/lib/data/templates'

export const metadata: Metadata = { title: 'New template' }

export default async function NewTemplatePage() {
  const user = await requireUser('/templates/new')
  const [templates, company] = await Promise.all([listTemplates(user.id), getDefaultCompany(user.id)])
  return (
    <>
      <PageHeader crumbs={[{ label: 'Templates', href: '/templates' }, { label: 'New template' }]} />
      <PageBody title="New template">
        <TemplateForm
          serviceTypes={[...new Set(templates.flatMap((template) => (template.serviceType ? [template.serviceType] : [])))]}
          initial={{ name: '', serviceType: '', description: '', style: 'light', currency: '', items: [], notes: company?.defaultNotes ?? [] }}
        />
      </PageBody>
    </>
  )
}
