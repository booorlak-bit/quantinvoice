'use client'

import { useState, type CSSProperties } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { MonthPoint } from '@/lib/data/dashboard'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

// Validated with the dataviz palette checks (all pairs, light on white and dark on neutral-900): blue for money that
// came in, red for money that is late, teal for money that is due later. Each mode has its own step.
const CONFIG = {
  received: { label: 'Received', theme: { light: 'var(--tw-blue-600)', dark: 'var(--tw-blue-500)' } },
  overdue: { label: 'Overdue', theme: { light: 'var(--tw-red-600)', dark: 'var(--tw-red-500)' } },
  scheduled: { label: 'Scheduled', theme: { light: 'var(--tw-teal-600)', dark: 'var(--tw-teal-600)' } },
} satisfies ChartConfig

type SeriesKey = keyof typeof CONFIG
/** Stack order, bottom to top. */
const SERIES: SeriesKey[] = ['received', 'overdue', 'scheduled']

const monthDate = (month: string) => new Date(`${month}T00:00:00Z`)
const monthLabel = (month: string, style: 'short' | 'long') =>
  new Intl.DateTimeFormat('en-US', { month: style === 'short' ? 'short' : 'long', year: style === 'short' ? undefined : 'numeric', timeZone: 'UTC' }).format(
    monthDate(month),
  )

/** Round axis steps (1, 2, 2.5 or 5 × 10ⁿ) so ticks read $0 / $5K / $10K, not $6.5K / $13K. */
function niceTicks(max: number) {
  const target = Math.max(max, 1) / 4
  const power = 10 ** Math.floor(Math.log10(target))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= target) ?? 10 * power
  const top = Math.ceil(Math.max(max, 1) / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step)
}

type BarShapeProps = { x?: number; y?: number; width?: number; height?: number; fill?: string; payload?: MonthPoint }

/**
 * One stacked segment: a 2px surface gap above the segment below it, and a 4px rounded end only on the top segment of
 * its column, square at the baseline.
 */
function segment(key: SeriesKey) {
  const index = SERIES.indexOf(key)
  return function Segment({ x = 0, y = 0, width = 0, height = 0, fill, payload }: BarShapeProps) {
    if (!payload || height <= 0) return <g />
    const below = SERIES.slice(0, index).some((other) => payload[other] > 0)
    const above = SERIES.slice(index + 1).some((other) => payload[other] > 0)
    const h = below ? height - 2 : height
    if (h <= 0) return <g />
    const r = above ? 0 : Math.min(4, width / 2, h)
    const d = [
      `M${x},${y + h}`,
      `L${x},${y + r}`,
      r ? `A${r},${r} 0 0 1 ${x + r},${y}` : '',
      `L${x + width - r},${y}`,
      r ? `A${r},${r} 0 0 1 ${x + width},${y + r}` : '',
      `L${x + width},${y + h}`,
      'Z',
    ].join(' ')
    return <path d={d} fill={fill} />
  }
}

const SHAPES = Object.fromEntries(SERIES.map((key) => [key, segment(key)])) as Record<SeriesKey, ReturnType<typeof segment>>

function PaymentsTooltip({ active, payload, currency, currentMonth }: { active?: boolean; payload?: { payload: MonthPoint }[]; currency: string; currentMonth: string }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  const rows = SERIES.filter((key) => point[key] > 0)
  const total = rows.reduce((sum, key) => sum + point[key], 0)
  return (
    <div className="flex min-w-44 flex-col gap-2 rounded-md border border-border/50 bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md backdrop-blur-md">
      <div className="font-medium">
        {monthLabel(point.month, 'long')}
        {point.month === currentMonth && <span className="text-muted-foreground"> · this month</span>}
      </div>
      {rows.length === 0 ? (
        <span className="text-muted-foreground">No payments</span>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="h-3 w-1 shrink-0 rounded-xs bg-(--color-key)" style={{ '--color-key': `var(--color-${key})` } as CSSProperties} />
              <span className="flex flex-1 items-center justify-between gap-4 leading-none">
                <span className="text-muted-foreground">{CONFIG[key].label}</span>
                <span className="font-medium text-foreground tabular-nums">{formatMoney(point[key], currency)}</span>
              </span>
            </div>
          ))}
          {rows.length > 1 && (
            <div className="flex items-center justify-between gap-4 border-t border-border pt-1.5 leading-none">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-foreground tabular-nums">{formatMoney(total, currency)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PaymentsChart({
  months,
  currentMonth,
  currency,
  received,
  historyMonths,
}: {
  months: MonthPoint[]
  currentMonth: string
  currency: string
  received: number
  historyMonths: number
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const expected = months.reduce((sum, point) => sum + point.overdue + point.scheduled, 0)
  const ticks = niceTicks(Math.max(...months.map((point) => point.received + point.overdue + point.scheduled)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>
          {formatMoney(received, currency)} received in the last {historyMonths} months · {formatMoney(expected, currency)} still to come
        </CardDescription>
        <CardAction>
          <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(next) => next && setView(next as typeof view)} aria-label="View">
            <ToggleGroupItem value="chart">Chart</ToggleGroupItem>
            <ToggleGroupItem value="table">Table</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className={cn(view === 'chart' && 'px-2')}>
        {view === 'chart' ? (
          <ChartContainer config={CONFIG} className="aspect-auto h-72 w-full">
            <BarChart accessibilityLayer data={months} margin={{ top: 8, right: 12, left: 4 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={4}
                tickFormatter={(month: string) =>
                  month === currentMonth ? 'Now' : month.endsWith('-01-01') ? `Jan ’${month.slice(2, 4)}` : monthLabel(month, 'short')
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                domain={[0, ticks[ticks.length - 1]]}
                ticks={ticks}
                tickFormatter={(value: number) => formatMoney(value, currency, { compact: true })}
              />
              <ChartTooltip cursor={{ radius: 6 }} content={<PaymentsTooltip currency={currency} currentMonth={currentMonth} />} />
              {SERIES.map((key) => (
                <Bar key={key} dataKey={key} stackId="money" fill={`var(--color-${key})`} maxBarSize={24} shape={SHAPES[key]} isAnimationActive={false} />
              ))}
              <ChartLegend content={<ChartLegendContent />} itemSorter={(item) => SERIES.indexOf(item.dataKey as SeriesKey)} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="rounded-lg border border-border px-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Month</TableHead>
                  {SERIES.map((key) => (
                    <TableHead key={key} className="text-right">
                      {CONFIG[key].label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((point) => (
                  <TableRow key={point.month}>
                    <TableCell className="font-medium">
                      {monthLabel(point.month, 'long')}
                      {point.month === currentMonth && <span className="text-muted-foreground"> · now</span>}
                    </TableCell>
                    {SERIES.map((key) => (
                      <TableCell key={key} className={cn('text-right tabular-nums', !point[key] && 'text-muted-foreground')}>
                        {point[key] ? formatMoney(point[key], currency) : '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
