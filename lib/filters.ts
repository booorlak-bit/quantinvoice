import { PERIODS, SORT_KEYS, STATUS_FILTERS, type InvoiceFilters, type Period, type Sort, type SortKey, type StatusFilter } from './types'

type Params = Record<string, string | string[] | undefined>

const pick = (params: Params, key: string) => {
  const value = params[key]
  return typeof value === 'string' ? value.trim() : ''
}

const uuid = (value: string) => (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : undefined)
const isoDate = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined)

/** Reads the shared invoice filters from URL search params. Unknown or malformed values are dropped. */
export function parseFilters(params: Params): InvoiceFilters {
  const status = pick(params, 'status')
  const period = pick(params, 'period')
  const currency = pick(params, 'currency').toUpperCase()
  return {
    companyId: uuid(pick(params, 'company')),
    clientId: uuid(pick(params, 'client')),
    projectId: uuid(pick(params, 'project')),
    status: (STATUS_FILTERS as readonly string[]).includes(status) ? (status as StatusFilter) : undefined,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : undefined,
    period: (PERIODS as readonly string[]).includes(period) ? (period as Period) : undefined,
    from: isoDate(pick(params, 'from')),
    to: isoDate(pick(params, 'to')),
    query: pick(params, 'q').slice(0, 100) || undefined,
  }
}

export function parseSort(params: Params, fallback: Sort = { key: 'issue', dir: 'desc' }): Sort {
  const key = pick(params, 'sort')
  if (!(SORT_KEYS as readonly string[]).includes(key)) return fallback
  return { key: key as SortKey, dir: pick(params, 'dir') === 'asc' ? 'asc' : 'desc' }
}

/** Serialises filters (and an optional sort) back into a query string, omitting empty values. */
export function toSearchParams(filters: InvoiceFilters, sort?: Sort) {
  const params = new URLSearchParams()
  const set = (key: string, value: string | undefined) => value && params.set(key, value)
  set('company', filters.companyId)
  set('client', filters.clientId)
  set('project', filters.projectId)
  set('status', filters.status)
  set('currency', filters.currency)
  if (filters.period && filters.period !== 'all') set('period', filters.period)
  if (filters.period === 'custom') {
    set('from', filters.from)
    set('to', filters.to)
  }
  set('q', filters.query)
  if (sort) {
    params.set('sort', sort.key)
    params.set('dir', sort.dir)
  }
  return params
}

export const PERIOD_LABELS: Record<Period, string> = {
  all: 'All time',
  'this-month': 'This month',
  'last-month': 'Last month',
  'last-30': 'Last 30 days',
  quarter: 'This quarter',
  year: 'This year',
  custom: 'Custom range',
}

export const STATUS_LABELS: Record<StatusFilter, string> = {
  draft: 'Draft',
  not_paid: 'Unpaid',
  overdue: 'Overdue',
  paid: 'Paid',
}
