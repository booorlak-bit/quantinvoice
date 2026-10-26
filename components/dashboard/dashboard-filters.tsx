'use client'

import { IconDollar } from 'central-icons'

import { FilterBar, SelectMenu, useFilterNavigation, type FilterOptions } from '@/components/app/filter-bar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { DashboardRange } from '@/lib/data/dashboard'
import type { InvoiceFilters } from '@/lib/types'

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '12m', label: '12M' },
]

/**
 * The one filter row above the dashboard. It is a `peer`: the content after it dims while new numbers load,
 * keeping the previous render in place.
 */
export function DashboardFilters({
  filters,
  options,
  currency,
  range,
}: {
  filters: InvoiceFilters
  options: FilterOptions
  currency: string
  range: DashboardRange
}) {
  const extra = { range: range === '6m' ? '' : range }
  const navigation = useFilterNavigation('/dashboard', filters, undefined, extra)

  return (
    <div className="peer" aria-busy={navigation.pending}>
      <FilterBar
        basePath="/dashboard"
        filters={filters}
        options={{ ...options, currencies: [] }}
        period={false}
        extraParams={extra}
        navigation={navigation}
      >
        {options.currencies.length > 1 && (
          <SelectMenu
            icon={<IconDollar />}
            label="Currency"
            value={currency}
            allowAll={false}
            options={options.currencies.map((code) => ({ value: code, label: code }))}
            onChange={(next) => navigation.navigate({ ...filters, currency: next })}
          />
        )}
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={range}
          onValueChange={(next) => next && navigation.navigate(filters, undefined, { range: next === '6m' ? '' : next })}
          aria-label="Months of history"
        >
          {RANGES.map((entry) => (
            <ToggleGroupItem key={entry.value} value={entry.value} aria-label={`Last ${entry.value.replace('m', '')} months`}>
              {entry.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FilterBar>
    </div>
  )
}
