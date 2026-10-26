import type { Metadata } from 'next'
import { IconLayersTwo } from 'central-icons'

import { ComingNext } from '@/components/app/coming-next'
import { PageBody, PageHeader } from '@/components/app/page-header'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Templates' }

export default async function TemplatesPage() {
  await requireUser('/templates')
  return (
    <>
      <PageHeader crumbs={[{ label: 'Templates' }]} />
      <PageBody title="Templates" description="Invoice styles and ready-made line items by service.">
        <ComingNext icon={<IconLayersTwo />} title="Templates are coming next" description="You can already pick a template when creating an invoice." />
      </PageBody>
    </>
  )
}
