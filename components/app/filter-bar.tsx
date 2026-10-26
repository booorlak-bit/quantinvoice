'use client'

import { format, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import type { DateRange } from 'react-day-picker'
import {
  IconBuildings,
  IconCrossMedium,
  IconDollar,
  IconFolder1,
  IconMagnifyingGlass,
  IconPeople,
} from 'central-icons'

import { BadgeNumber } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarPreset } from '@/components/ui/calendar'
import { DatePicker, DatePickerContent, DatePickerTrigger } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { PERIOD_LABELS, toSearchParams } from '@/lib/filters'
import type { InvoiceFilters, Period, Sort } from '@/lib/types'
import { cn } from '@/lib/utils'

export type FilterOptions = {
  companies: { id: string; name: string }[]
  clients: { id: string; name: string; company: string | null; projects: { id: string; name: string }[] }[]
  currencies: string[]
}

/** Navigates to the same page with new filters; the server re-renders with them. `extra` keeps page-specific params. */
export function useFilterNavigation(basePath: string, filters: InvoiceFilters, sort?: Sort, extra: Record<string, string> = {}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const navigate = (next: InvoiceFilters, nextSort = sort, nextExtra = extra) => {
    const params = toSearchParams(next, nextSort)
    for (const [key, value] of Object.entries(nextExtra)) if (value) params.set(key, value)
    const query = params.toString()
    startTransition(() => router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false }))
  }
  return { navigate, pending }
}

const clientLabel = (client: { name: string; company: string | null }) => client.company ?? client.name

const PERIOD_PRESETS: Exclude<Period, 'custom'>[] = ['all', 'this-month', 'last-month', 'last-30', 'quarter', 'year']

export function FilterBar({
  basePath,
  filters,
  sort,
  options,
  search = false,
  period = true,
  extraParams,
  navigation,
  className,
  children,
}: {
  basePath: string
  filters: InvoiceFilters
  sort?: Sort
  options: FilterOptions
  search?: boolean
  /** Shows the issue-date period picker. */
  period?: boolean
  /** Page-specific search params to keep when filters change. */
  extraParams?: Record<string, string>
  /** A navigation shared with other controls on the page, so they report one pending state. */
  navigation?: ReturnType<typeof useFilterNavigation>
  className?: string
  /** Extra controls at the end of the bar (sort menus, view switches). */
  children?: ReactNode
}) {
  const own = useFilterNavigation(basePath, filters, sort, extraParams)
  const { navigate, pending } = navigation ?? own
  const set = (patch: Partial<InvoiceFilters>) => navigate({ ...filters, ...patch })

  const client = options.clients.find((entry) => entry.id === filters.clientId)
  const projects = client
    ? client.projects.map((project) => ({ id: project.id, name: project.name }))
    : options.clients.flatMap((entry) =>
        entry.projects.map((project) => ({ id: project.id, name: `${project.name} · ${clientLabel(entry)}` })),
      )
  const project = projects.find((entry) => entry.id === filters.projectId)
  const company = options.companies.find((entry) => entry.id === filters.companyId)

  const chips: { key: string; label: string; clear: () => void }[] = []
  if (company) chips.push({ key: 'company', label: `Company: ${company.name}`, clear: () => set({ companyId: undefined }) })
  if (client)
    chips.push({ key: 'client', label: `Client: ${clientLabel(client)}`, clear: () => set({ clientId: undefined, projectId: undefined }) })
  if (project) chips.push({ key: 'project', label: `Project: ${project.name.split(' · ')[0]}`, clear: () => set({ projectId: undefined }) })
  if (filters.currency) chips.push({ key: 'currency', label: `Currency: ${filters.currency}`, clear: () => set({ currency: undefined }) })

  return (
    <div className={cn('flex flex-col gap-2 transition-opacity', pending && 'opacity-70', className)} aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-2">
        {search && <SearchInput value={filters.query ?? ''} onChange={(query) => set({ query: query || undefined })} />}
        {options.companies.length > 1 && (
          <SelectMenu
            icon={<IconBuildings />}
            label="Company"
            value={filters.companyId}
            options={options.companies.map((entry) => ({ value: entry.id, label: entry.name }))}
            onChange={(companyId) => set({ companyId })}
          />
        )}
        <SelectMenu
          icon={<IconPeople />}
          label="Client"
          value={filters.clientId}
          options={options.clients.map((entry) => ({ value: entry.id, label: clientLabel(entry) }))}
          onChange={(clientId) => set({ clientId, projectId: undefined })}
        />
        {projects.length > 0 && (
          <SelectMenu
            icon={<IconFolder1 />}
            label="Project"
            value={filters.projectId}
            options={projects.map((entry) => ({ value: entry.id, label: entry.name }))}
            onChange={(projectId) => set({ projectId })}
          />
        )}
        {options.currencies.length > 1 && (
          <SelectMenu
            icon={<IconDollar />}
            label="Currency"
            value={filters.currency}
            options={options.currencies.map((code) => ({ value: code, label: code }))}
            onChange={(currency) => set({ currency })}
          />
        )}
        {period && <PeriodPicker filters={filters} onChange={(patch) => set(patch)} />}
        {children && <div className="flex items-center gap-2 md:ml-auto">{children}</div>}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Button key={chip.key} variant="secondary" size="sm" onClick={chip.clear}>
              {chip.label}
              <IconCrossMedium aria-label="Remove filter" />
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ status: filters.status, query: filters.query, period: filters.period, from: filters.from, to: filters.to })}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value)
  const latest = useRef(onChange)
  const first = useRef(true)

  useEffect(() => {
    latest.current = onChange
  })

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const timer = setTimeout(() => latest.current(text.trim()), 300)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <InputGroup className="w-full sm:w-64">
      <InputGroupAddon>
        <IconMagnifyingGlass />
      </InputGroupAddon>
      <InputGroupInput
        placeholder="Search invoices"
        aria-label="Search invoices"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && setText('')}
      />
    </InputGroup>
  )
}

export function SelectMenu({
  icon,
  label,
  value,
  options,
  onChange,
  allowAll = true,
}: {
  icon: ReactNode
  label: string
  value: string | undefined
  options: { value: string; label: string }[]
  onChange: (value: string | undefined) => void
  /** Offers an "All" choice that clears the filter. */
  allowAll?: boolean
}) {
  const current = options.find((option) => option.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-56">
          {icon}
          <span className="truncate">{current ? current.label : label}</span>
          {current && allowAll && (
            <BadgeNumber variant="secondary" className="-mr-0.5">
              1
            </BadgeNumber>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-60 overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Filter by {label.toLowerCase()}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value ?? ''} onValueChange={(next) => onChange(next || undefined)}>
          {allowAll && (
            <>
              <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
            </>
          )}
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <span className="truncate">{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PeriodPicker({ filters, onChange }: { filters: InvoiceFilters; onChange: (patch: Partial<InvoiceFilters>) => void }) {
  const [open, setOpen] = useState(false)
  const period = filters.period ?? 'all'
  const range: DateRange | undefined =
    period === 'custom' && filters.from ? { from: parseISO(filters.from), to: filters.to ? parseISO(filters.to) : undefined } : undefined
  const label =
    period === 'custom' && range?.from
      ? range.to
        ? `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`
        : format(range.from, 'MMM d, yyyy')
      : PERIOD_LABELS[period]

  return (
    <DatePicker open={open} onOpenChange={setOpen}>
      <DatePickerTrigger className="w-auto min-w-36" aria-label={`Issue date: ${label}`}>
        {label}
      </DatePickerTrigger>
      <DatePickerContent align="start" aria-label="Choose a period">
        <div className="flex flex-col overflow-hidden rounded-lg bg-background shadow-sm inset-ring inset-ring-border sm:flex-row">
          <div className="flex gap-2 overflow-x-auto border-b border-border p-3 sm:w-36 sm:flex-col sm:border-r sm:border-b-0">
            {PERIOD_PRESETS.map((preset) => (
              <CalendarPreset
                key={preset}
                selected={period === preset}
                className="w-auto sm:w-full"
                onClick={() => {
                  onChange({ period: preset, from: undefined, to: undefined })
                  setOpen(false)
                }}
              >
                {PERIOD_LABELS[preset]}
              </CalendarPreset>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={(next) => {
              if (!next?.from) return
              onChange({
                period: 'custom',
                from: format(next.from, 'yyyy-MM-dd'),
                to: next.to ? format(next.to, 'yyyy-MM-dd') : undefined,
              })
              if (next.to) setOpen(false)
            }}
            defaultMonth={range?.from}
            className="rounded-none bg-transparent shadow-none inset-ring-0"
          />
        </div>
      </DatePickerContent>
    </DatePicker>
  )
}
