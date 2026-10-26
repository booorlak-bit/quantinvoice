'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconChainLink1,
  IconCircleCheck,
  IconClock,
  IconDotGrid1x3Horizontal,
  IconFileText,
  IconMagnifyingGlass,
  IconPencil,
  IconPlusMedium,
  IconSortArrowUpDown,
  IconSquareArrowTopRight,
  IconTrashCan,
} from 'central-icons'

import { deleteInvoicesAction, setStatusAction } from '@/app/(app)/invoices/actions'
import { FilterBar, useFilterNavigation, type FilterOptions } from '@/components/app/filter-bar'
import { InvoiceStatusBadge } from '@/components/invoices/status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BadgeNumber } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { StatusCounts } from '@/lib/data/invoices'
import { STATUS_LABELS } from '@/lib/filters'
import { formatDate, formatMoney } from '@/lib/format'
import type { InvoiceFilters, InvoiceStatus, InvoiceSummary, Sort, SortKey, StatusFilter } from '@/lib/types'
import { cn } from '@/lib/utils'

const TABS: { value: StatusFilter | 'all'; count: keyof StatusCounts }[] = [
  { value: 'all', count: 'all' },
  { value: 'draft', count: 'draft' },
  { value: 'not_paid', count: 'notPaid' },
  { value: 'overdue', count: 'overdue' },
  { value: 'paid', count: 'paid' },
]

const COLUMNS: { key: SortKey; label: string; align?: 'right'; className?: string }[] = [
  { key: 'number', label: 'Invoice' },
  { key: 'title', label: 'Title' },
  { key: 'client', label: 'Client' },
  { key: 'project', label: 'Project', className: 'hidden xl:table-cell' },
  { key: 'status', label: 'Status' },
  { key: 'issue', label: 'Issued', className: 'hidden lg:table-cell' },
  { key: 'due', label: 'Due' },
  { key: 'total', label: 'Total', align: 'right' },
]

export function publicInvoiceUrl(slug: string) {
  return `${window.location.origin}/i/${slug}`
}

export function InvoicesView({
  invoices,
  counts,
  filters,
  sort,
  options,
}: {
  invoices: InvoiceSummary[]
  counts: StatusCounts
  filters: InvoiceFilters
  sort: Sort
  options: FilterOptions
}) {
  const router = useRouter()
  const { navigate } = useFilterNavigation('/invoices', filters, sort)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const [working, startWork] = useTransition()

  const visibleSelected = invoices.filter((invoice) => selected.has(invoice.id)).map((invoice) => invoice.id)
  const allSelected = invoices.length > 0 && visibleSelected.length === invoices.length
  const toggle = (id: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const setStatus = (ids: string[], status: InvoiceStatus) =>
    startWork(async () => {
      await setStatusAction(ids, status)
      setSelected(new Set())
      toast.success(ids.length === 1 ? 'Invoice updated' : `${ids.length} invoices updated`)
    })

  const remove = (ids: string[]) =>
    startWork(async () => {
      const { count } = await deleteInvoicesAction(ids)
      setSelected(new Set())
      setConfirmDelete(null)
      toast.success(count === 1 ? 'Invoice deleted' : `${count} invoices deleted`)
    })

  const sortBy = (key: SortKey) =>
    navigate(filters, { key, dir: sort.key === key && sort.dir === 'asc' ? 'desc' : sort.key === key ? 'asc' : key === 'issue' || key === 'due' || key === 'total' ? 'desc' : 'asc' })

  const filtered = Boolean(filters.clientId || filters.companyId || filters.projectId || filters.currency || filters.query || (filters.period && filters.period !== 'all'))

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Tabs value={filters.status ?? 'all'} onValueChange={(value) => navigate({ ...filters, status: value === 'all' ? undefined : (value as StatusFilter) })}>
          <TabsList variant="navigation" className="w-max">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.value === 'all' ? 'All' : STATUS_LABELS[tab.value]}
                <BadgeNumber variant="secondary" className="tabular-nums">
                  {counts[tab.count]}
                </BadgeNumber>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <FilterBar basePath="/invoices" filters={filters} sort={sort} options={options} search>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <IconSortArrowUpDown />
              {COLUMNS.find((column) => column.key === sort.key)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {COLUMNS.map((column) => (
              <DropdownMenuItem key={column.key} onSelect={() => sortBy(column.key)}>
                {column.label}
                {sort.key === column.key && (sort.dir === 'asc' ? <IconArrowUp className="ml-auto" /> : <IconArrowDown className="ml-auto" />)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </FilterBar>

      {visibleSelected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
          <span className="text-sm font-medium text-foreground tabular-nums">{visibleSelected.length} selected</span>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" disabled={working} onClick={() => setStatus(visibleSelected, 'paid')}>
              <IconCircleCheck />
              Mark as paid
            </Button>
            <Button variant="outline" size="sm" disabled={working} onClick={() => setStatus(visibleSelected, 'not_paid')}>
              <IconClock />
              Mark as unpaid
            </Button>
            <Button variant="outline" size="sm" disabled={working} onClick={() => setStatus(visibleSelected, 'draft')}>
              <IconFileText />
              Move to drafts
            </Button>
            <Button variant="destructive" size="sm" disabled={working} onClick={() => setConfirmDelete(visibleSelected)}>
              <IconTrashCan />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">{filtered || filters.status ? <IconMagnifyingGlass /> : <IconFileText />}</EmptyMedia>
            <EmptyTitle>{filtered || filters.status ? 'No invoices match' : 'No invoices yet'}</EmptyTitle>
            <EmptyDescription>
              {filtered || filters.status
                ? 'Try another search, or clear the filters to see every invoice.'
                : 'Create your first invoice and share it with a client.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {filtered || filters.status ? (
              <Button variant="outline" size="sm" onClick={() => navigate({})}>
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/invoices/new">
                  <IconPlusMedium />
                  New invoice
                </Link>
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="hidden rounded-lg border border-border px-2 md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <Checkbox
                      aria-label="Select all invoices"
                      checked={allSelected ? true : visibleSelected.length > 0 ? 'indeterminate' : false}
                      onCheckedChange={(checked) => setSelected(checked === true ? new Set(invoices.map((invoice) => invoice.id)) : new Set())}
                    />
                  </TableHead>
                  {COLUMNS.map((column) => (
                    <TableHead key={column.key} align={column.align === 'right' ? 'right' : 'left'} className={column.className} aria-sort={sort.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                      <button
                        type="button"
                        onClick={() => sortBy(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:shadow-focus',
                          sort.key === column.key && 'text-foreground',
                        )}
                      >
                        {column.label}
                        {sort.key === column.key ? (
                          sort.dir === 'asc' ? <IconArrowUp className="size-3.5" /> : <IconArrowDown className="size-3.5" />
                        ) : (
                          <IconSortArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    data-state={selected.has(invoice.id) ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  >
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        aria-label={`Select invoice ${invoice.number}`}
                        checked={selected.has(invoice.id)}
                        onCheckedChange={(checked) => toggle(invoice.id, checked === true)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{invoice.number}</TableCell>
                    <TableCell className="max-w-56 truncate">
                      <Link href={`/invoices/${invoice.id}`} onClick={(event) => event.stopPropagation()} className="outline-none hover:underline focus-visible:underline">
                        {invoice.title}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{invoice.clientCompany ?? invoice.clientName}</TableCell>
                    <TableCell className="hidden max-w-40 truncate text-muted-foreground xl:table-cell">{invoice.projectName ?? '—'}</TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} overdue={invoice.overdue} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell className={cn('tabular-nums', invoice.overdue ? 'text-destructive' : 'text-muted-foreground')}>
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell align="right" className="tabular-nums">
                      {formatMoney(invoice.total, invoice.currency)}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <RowMenu invoice={invoice} onStatus={(status) => setStatus([invoice.id], status)} onDelete={() => setConfirmDelete([invoice.id])} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <Checkbox
                  className="mt-0.5"
                  aria-label={`Select invoice ${invoice.number}`}
                  checked={selected.has(invoice.id)}
                  onCheckedChange={(checked) => toggle(invoice.id, checked === true)}
                />
                <Link href={`/invoices/${invoice.id}`} className="flex min-w-0 flex-1 flex-col gap-1 outline-none">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{invoice.title}</span>
                    <span className="text-sm font-medium text-foreground tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {invoice.number} · {invoice.clientCompany ?? invoice.clientName}
                    {invoice.projectName ? ` · ${invoice.projectName}` : ''}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <InvoiceStatusBadge status={invoice.status} overdue={invoice.overdue} />
                    <span className={cn('text-xs tabular-nums', invoice.overdue ? 'text-destructive' : 'text-muted-foreground')}>
                      Due {formatDate(invoice.dueDate)}
                    </span>
                  </span>
                </Link>
                <RowMenu invoice={invoice} onStatus={(status) => setStatus([invoice.id], status)} onDelete={() => setConfirmDelete([invoice.id])} />
              </li>
            ))}
          </ul>
        </>
      )}

      <AlertDialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete?.length === 1 ? 'Delete this invoice?' : `Delete ${confirmDelete?.length} invoices?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their pages stop working for clients, and their payments are removed from the dashboard. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={working}
              onClick={(event) => {
                event.preventDefault()
                if (confirmDelete) remove(confirmDelete)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function RowMenu({ invoice, onStatus, onDelete }: { invoice: InvoiceSummary; onStatus: (status: InvoiceStatus) => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${invoice.number}`}>
          <IconDotGrid1x3Horizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${invoice.id}`}>
            <IconArrowRight />
            Open
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <IconPencil />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await navigator.clipboard.writeText(publicInvoiceUrl(invoice.slug))
            toast.success('Link copied')
          }}
        >
          <IconChainLink1 />
          Copy client link
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`/i/${invoice.slug}`} target="_blank" rel="noopener noreferrer">
            <IconSquareArrowTopRight />
            Open client page
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {invoice.status !== 'paid' ? (
          <DropdownMenuItem onSelect={() => onStatus('paid')}>
            <IconCircleCheck />
            Mark as paid
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onStatus('not_paid')}>
            <IconClock />
            Mark as unpaid
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <IconTrashCan />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
