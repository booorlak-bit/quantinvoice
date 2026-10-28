import type { Metadata } from 'next'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { BrandsSection, DevicesCard, ProfileCard } from '@/components/settings/settings-sections'
import { requireUser } from '@/lib/auth'
import { listCompanies } from '@/lib/data/companies'
import { sendingDomain } from '@/lib/email'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage({ searchParams }: PageProps<'/settings'>) {
  const user = await requireUser('/settings')
  const [brands, params] = await Promise.all([listCompanies(user.id), searchParams])

  return (
    <>
      <PageHeader crumbs={[{ label: 'Settings' }]} />
      <PageBody title="Settings" description="Your brands, profile and devices.">
        <div className="flex max-w-5xl flex-col gap-8">
          <BrandsSection companies={brands} openNew={params.brand === 'new' || brands.length === 0} senderDomain={sendingDomain()} />
          <ProfileCard user={user} />
          <DevicesCard />
        </div>
      </PageBody>
    </>
  )
}
