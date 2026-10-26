'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { IconArrowDown, IconArrowUp, IconMagnifyingGlass, IconPeople, IconPeopleAdd, IconSortArrowUpDown } from 'central-icons'

import { NewClientDialog } from '@/components/clients/new-client-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ClientSort } from '@/lib/data/clients'
import { formatDate, formatMoney } from '@/lib/format'
import type { ClientSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

const COLUMNS: { key: ClientSort | null; label: string; className?: string }[] = [
  { key: 'name', label: 'Client' },
  { key: 'company', label: 'Company', className: 'hidden lg:table-cell' },
  { key: null, label: 'Projects' },
  { key: null, label: 'Contact', className: 'hidden md:table-cell' },
  { key: 'added', label: 'Added', className: 'hidden xl:table-cell' },
  { key: 'invoices', label: 'Outstanding' },
]

export function clientInitials(client: { name: string; company: string | null }) {
  const words = (client.company ?? client.name).split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}

function outstandingText(client: ClientSummary) {
  const owed = client.totals.filter((total) => Number(total.outstanding) > 0)
  if (owed.length === 0) return null
  return owed.map((total) => formatMoney(total.outstanding, total.currency)).join(' + ')
}

export function ProjectsCell({ projects }: { projects: { id: string; name: string }[] }) {
  if (projects.length === 0) return <span className="text-muted-foreground">—</span>
  const [first, ...rest] = projects
  return (
    <span className="flex items-center gap-1.5">
      <Badge variant="secondary" className="max-w-40 truncate">
        {first.name}
      </Badge>
      {rest.length > 0 && (
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <button type="button" className="rounded-sm text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:shadow-focus" onClick={(event) => event.stopPropagation()}>
              +{rest.length}
            </button>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-56">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{projects.length} projects</p>
            <ul className="flex flex-col gap-1">
              {projects.map((project) => (
                <li key={project.id} className="truncate text-sm font-medium text-foreground">
                  {project.name}
                </li>
              ))}
            </ul>
          </HoverCardContent>
        </HoverCard>
      )}
    </span>
  )
}

export function ClientsView({ clients, query, sort, dir }: { clients: ClientSummary[]; query: string; sort: ClientSort; dir: 'asc' | 'desc' }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [text, setText] = useState(query)
  const first = useRef(true)

  const go = (next: { q?: string; sort?: ClientSort; dir?: 'asc' | 'desc' }) => {
    const params = new URLSearchParams()
    const q = next.q ?? query
    if (q) params.set('q', q)
    params.set('sort', next.sort ?? sort)
    params.set('dir', next.dir ?? dir)
    startTransition(() => router.replace(`/clients?${params}`, { scroll: false }))
  }

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const timer = setTimeout(() => go({ q: text.trim() }), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <div className={cn('flex flex-col gap-4 transition-opacity', pending && 'opacity-70')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <IconMagnifyingGlass />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search clients" aria-label="Search clients" value={text} onChange={(event) => setText(event.target.value)} />
        </InputGroup>
        <Button onClick={() => setDialogOpen(true)}>
          <IconPeopleAdd />
          New client
        </Button>
      </div>

      {clients.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">{query ? <IconMagnifyingGlass /> : <IconPeople />}</EmptyMedia>
            <EmptyTitle>{query ? 'No clients match' : 'No clients yet'}</EmptyTitle>
            <EmptyDescription>{query ? 'Try another name, company or email.' : 'Add the people and companies you bill.'}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {query ? (
              <Button variant="outline" size="sm" onClick={() => setText('')}>
                Clear search
              </Button>
            ) : (
              <Button onClick={() => setDialogOpen(true)}>
                <IconPeopleAdd />
                New client
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="rounded-lg border border-border px-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((column) => (
                  <TableHead key={column.label} className={column.className}>
                    {column.key ? (
                      <button
                        type="button"
                        onClick={() => go({ sort: column.key!, dir: sort === column.key && dir === 'asc' ? 'desc' : 'asc' })}
                        className={cn('inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:shadow-focus', sort === column.key && 'text-foreground')}
                      >
                        {column.label}
                        {sort === column.key ? (
                          dir === 'asc' ? <IconArrowUp className="size-3.5" /> : <IconArrowDown className="size-3.5" />
                        ) : (
                          <IconSortArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="cursor-pointer" onClick={() => router.push(`/clients/${client.id}`)}>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-2.5 outline-none">
                      <Avatar size="8">
                        <AvatarFallback>{clientInitials(client)}</AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground">{client.name}</span>
                        {client.company && <span className="truncate text-xs text-muted-foreground lg:hidden">{client.company}</span>}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate lg:table-cell">{client.company ?? '—'}</TableCell>
                  <TableCell>
                    <ProjectsCell projects={client.projects} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex flex-col">
                      <span className="truncate">{client.email ?? '—'}</span>
                      {client.phone && <span className="truncate text-xs text-muted-foreground">{client.phone}</span>}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums xl:table-cell">{formatDate(client.createdAt)}</TableCell>
                  <TableCell className="tabular-nums">
                    {outstandingText(client) ?? <span className="text-muted-foreground">{client.invoiceCount ? 'Settled' : 'No invoices'}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <NewClientDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={(client) => router.push(`/clients/${client.id}`)} />
    </div>
  )
}
