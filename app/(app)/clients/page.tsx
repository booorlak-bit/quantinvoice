import type { Metadata } from 'next'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { ClientsView } from '@/components/clients/clients-view'
import { requireUser } from '@/lib/auth'
import { listClients, type ClientSort } from '@/lib/data/clients'

export const metadata: Metadata = { title: 'Clients' }

const SORTS: ClientSort[] = ['name', 'company', 'added', 'invoices']

export default async function ClientsPage({ searchParams }: PageProps<'/clients'>) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : ''
  const sort = SORTS.includes(params.sort as ClientSort) ? (params.sort as ClientSort) : 'name'
  const dir = params.dir === 'desc' ? 'desc' : 'asc'
  const user = await requireUser('/clients')
  const clients = await listClients(user.id, { query, sort, dir })

  return (
    <>
      <PageHeader crumbs={[{ label: 'Clients' }]} />
      <PageBody title="Clients" description={`${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`}>
        <ClientsView clients={clients} query={query} sort={sort} dir={dir} />
      </PageBody>
    </>
  )
}
