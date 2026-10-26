import type { Metadata } from 'next'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { AccountsSection, CompaniesSection, PasswordCard, ProfileCard } from '@/components/settings/settings-sections'
import { requireUser } from '@/lib/auth'
import { listCompanies } from '@/lib/data/companies'
import { listAccounts } from '@/lib/data/users'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage({ searchParams }: PageProps<'/settings'>) {
  const user = await requireUser('/settings')
  const [companies, accounts, params] = await Promise.all([
    listCompanies(user.id),
    user.role === 'owner' ? listAccounts() : Promise.resolve(null),
    searchParams,
  ])

  return (
    <>
      <PageHeader crumbs={[{ label: 'Settings' }]} />
      <PageBody title="Settings" description="Your companies, profile and sign-in.">
        <div className="flex max-w-5xl flex-col gap-8">
          <CompaniesSection companies={companies} openNew={params.company === 'new' || companies.length === 0} />
          <ProfileCard user={user} />
          <PasswordCard />
          {accounts && <AccountsSection accounts={accounts} currentUserId={user.id} />}
        </div>
      </PageBody>
    </>
  )
}
