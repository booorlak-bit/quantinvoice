import type { Metadata } from 'next'
import Link from 'next/link'
import { IconPlusMedium } from 'central-icons'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { TemplatesView } from '@/components/templates/templates-view'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { listTemplates } from '@/lib/data/templates'

export const metadata: Metadata = { title: 'Templates' }

export default async function TemplatesPage() {
  const user = await requireUser('/templates')
  const templates = await listTemplates(user.id)
  return (
    <>
      <PageHeader crumbs={[{ label: 'Templates' }]} />
      <PageBody
        title="Templates"
        description="Line items, notes and a style for each kind of work."
        actions={
          <Button asChild>
            <Link href="/templates/new">
              <IconPlusMedium />
              New template
            </Link>
          </Button>
        }
      >
        <TemplatesView
          templates={templates.map((template) => ({
            id: template.id,
            name: template.name,
            serviceType: template.serviceType,
            description: template.description,
            style: template.style,
            currency: template.currency,
            items: template.items,
            invoiceCount: template.invoiceCount,
          }))}
        />
      </PageBody>
    </>
  )
}
