'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import type { LegendPayload, TooltipPayloadEntry, TooltipValueType } from 'recharts'

import { cn } from '@/lib/utils'

// Figma: Charts page (16:13777) — shadcn Chart on recharts v3.
// The library draws every chart from the same building blocks, which live here:
//   Charts / Tooltip (16:14050) + Tooltip Item (Type = Default | Icon | Line | Total) → ChartTooltipContent
//   Charts / Legend (16:13959) + Legend Item (Type = Default | Icon)                   → ChartLegendContent
//   Charts / Grid, axes, cursor, radial track, pie stroke                              → ChartContainer element styles
// Series colours come from the config (`color: 'var(--chart-1)'` … `var(--chart-5)` = base/chart-1…5) and are exposed to
// the chart as `var(--color-<key>)`. The chart types themselves (Bar / Area / Line / Pie / Radar / Radial) are recharts
// compositions, documented on the Chart page.

// Format: { THEME_NAME: CSS_SELECTOR }. Kept for shadcn API parity — colours resolve with `light-dark()` against the
// inherited `color-scheme` of the mode (`.light` / `.dark` / `[data-mode]`), so nested light/dark previews work too.
const THEMES = { light: '', dark: '.dark' } as const

const INITIAL_DIMENSION = { width: 320, height: 200 } as const

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> })
>

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  /** Series keys → label, colour (or light/dark theme colours) and optional icon. */
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  /** Size used for the first render, before the container has been measured. */
  initialDimension?: { width: number; height: number }
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${(id ?? uniqueId).replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          'flex aspect-video justify-center text-xs text-foreground',
          // Charts / Grid: 1px base/border lines; axis labels text-xs base/muted-foreground.
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
          '[&_.recharts-polar-angle-axis-tick_text]:fill-muted-foreground [&_.recharts-polar-radius-axis-tick_text]:fill-foreground',
          // Hover cursor: muted band behind bars, border line on line/area charts.
          '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted',
          // Radial track (Radial Chart background) is base/muted.
          '[&_.recharts-radial-bar-background-sector]:fill-muted',
          // recharts paints white (#fff) dot and sector strokes by default — Figma has none unless the chart asks for one.
          "[&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          // recharts' accessibility layer makes the chart surface (and a pie's layer) a Tab stop: no browser outline,
          // the focus/default ring instead (keyboard focus only), so a chart without a tooltip still shows focus.
          '[&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden',
          '[&_.recharts-surface:focus-visible]:shadow-focus [&_.recharts-layer:focus-visible]:outline-1 [&_.recharts-layer:focus-visible]:outline-ring [&_.recharts-layer:focus-visible]:outline-solid',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/** Writes `--color-<key>` for every configured series, scoped to one chart. */
export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.theme || item.color)

  if (!colorConfig.length) {
    return null
  }

  const declarations = colorConfig
    .map(([key, item]) => {
      const color = item.theme ? `light-dark(${item.theme.light}, ${item.theme.dark})` : item.color
      return `  --color-${key}: ${color};`
    })
    .join('\n')

  return <style dangerouslySetInnerHTML={{ __html: `[data-chart="${id}"] {\n${declarations}\n}` }} />
}

export const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipNameType = number | string

export type ChartTooltipContentProps = {
  className?: string
  /** Set by recharts. */
  active?: boolean
  /** Set by recharts: one entry per series under the cursor. */
  payload?: ReadonlyArray<TooltipPayloadEntry>
  /** Set by recharts: the category under the cursor. Figma Tooltip `header`. */
  label?: React.ReactNode
  labelFormatter?: (label: React.ReactNode, payload: ReadonlyArray<TooltipPayloadEntry>) => React.ReactNode
  labelClassName?: string
  /** Replaces the whole item row. */
  formatter?: (
    value: TooltipValueType | undefined,
    name: TooltipNameType | undefined,
    item: TooltipPayloadEntry,
    index: number,
    payload: TooltipPayloadEntry['payload'],
  ) => React.ReactNode
  /** Overrides the indicator colour of every item. */
  color?: string
  /** Hides the header. Figma Tooltip `showHeader = false`. */
  hideLabel?: boolean
  /** Hides the swatch. Figma Tooltip Item `showShape = false`. */
  hideIndicator?: boolean
  /** Figma Tooltip Item Type: Default → "dot", Line → "line". A config `icon` renders the Icon type. */
  indicator?: 'line' | 'dot' | 'dashed'
  /** Payload key used to look up the item config (defaults to the series dataKey / name). */
  nameKey?: string
  /** Payload key used to look up the header label in the config. */
  labelKey?: string
  /** Muted unit after every value, e.g. "kcal". Figma Tooltip Item `unit`. */
  unit?: React.ReactNode
  /** Adds the footer: a separator and the sum of all values. Figma Tooltip `showFooter` / Tooltip Item Type = Total. */
  showTotal?: boolean
  /** Footer label. */
  totalLabel?: React.ReactNode
}

function formatValue(value: TooltipValueType | undefined) {
  if (typeof value === 'number') return value.toLocaleString()
  if (Array.isArray(value)) return value.join(' – ')
  return value
}

function TooltipValue({ value, unit }: { value: React.ReactNode; unit?: React.ReactNode }) {
  return (
    <span data-slot="chart-tooltip-value" className="flex shrink-0 items-center gap-0.5 leading-none whitespace-nowrap">
      <span className="font-medium text-foreground tabular-nums">{value}</span>
      {unit != null && <span className="text-muted-foreground">{unit}</span>}
    </span>
  )
}

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  unit,
  showTotal = false,
  totalLabel = 'Total',
}: ChartTooltipContentProps) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value = !labelKey && typeof label === 'string' ? config[label]?.label || label : itemConfig?.label

    if (labelFormatter) {
      return (
        <div data-slot="chart-tooltip-label" className={cn('font-medium text-popover-foreground', labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return (
      <div data-slot="chart-tooltip-label" className={cn('font-medium text-popover-foreground', labelClassName)}>
        {value}
      </div>
    )
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) {
    return null
  }

  const items = payload.filter((item) => item.type !== 'none')
  const nestLabel = items.length === 1 && indicator !== 'dot'
  const total = items.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : Number(item.value) || 0), 0)

  return (
    <div
      data-slot="chart-tooltip-content"
      className={cn(
        // Figma Charts / Tooltip: base/popover · 1px border · rounded-md · shadow/md · px-2.5 py-1.5 · gap-2 · text-xs.
        'flex min-w-32 flex-col gap-2 rounded-md border border-border/50 bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md backdrop-blur-md',
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        {!nestLabel ? tooltipLabel : null}
        <div className="flex flex-col gap-1.5">
          {items.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload?.fill || item.color

            return (
              <div
                key={`${item.dataKey ?? item.name ?? index}`}
                data-slot="chart-tooltip-item"
                className={cn(
                  // Figma Tooltip Item: gap-2 (gap-1.5 next to an icon), 12px icons in base/foreground.
                  'flex w-full items-center gap-2 [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:text-foreground',
                  itemConfig?.icon && 'gap-1.5',
                  nestLabel && 'items-stretch',
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          data-slot="chart-tooltip-indicator"
                          data-indicator={indicator}
                          className={cn('shrink-0 rounded-xs border-(--color-border) bg-(--color-bg)', {
                            'size-2': indicator === 'dot',
                            'w-1': indicator === 'line',
                            'w-0 border-(length:--border-1) border-dashed bg-transparent': indicator === 'dashed',
                            'h-3': !nestLabel && indicator !== 'dot',
                            'my-0.5': nestLabel && indicator === 'dashed',
                          })}
                          style={
                            {
                              '--color-bg': indicatorColor,
                              '--color-border': indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn('flex flex-1 justify-between gap-2 leading-none', nestLabel ? 'items-end' : 'items-center')}
                    >
                      <div className="flex flex-col gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
                      </div>
                      {item.value != null && <TooltipValue value={formatValue(item.value)} unit={unit} />}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {showTotal && (
        <div data-slot="chart-tooltip-total" className="flex flex-col">
          {/* Figma Separator: a 12px slot with the 1px base/border line in the middle. */}
          <div className="flex h-3 items-center" aria-hidden="true">
            <div className="h-px w-full bg-border" />
          </div>
          <div className="flex w-full items-center gap-2 leading-none">
            <span className="flex-1 font-medium text-foreground">{totalLabel}</span>
            <TooltipValue value={total.toLocaleString()} unit={unit} />
          </div>
        </div>
      )}
    </div>
  )
}

export const ChartLegend = RechartsPrimitive.Legend

export type ChartLegendContentProps = {
  className?: string
  /** Set by recharts: one entry per series (or per sector for pie charts). */
  payload?: ReadonlyArray<LegendPayload>
  /** Set by recharts; adds the gap on the side that faces the chart. */
  verticalAlign?: 'top' | 'bottom' | 'middle'
  /** Shows the colour swatch even when the config has an icon. Figma Legend Item Type = Default. */
  hideIcon?: boolean
  /** Payload key used to look up the item config (e.g. "browser" for pie charts). */
  nameKey?: string
}

export function ChartLegendContent({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey }: ChartLegendContentProps) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      data-slot="chart-legend-content"
      className={cn(
        // Figma Charts / Legend: wrapping row, 16px gap on both axes, centred.
        'flex flex-wrap items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item) => {
          const key = `${nameKey || item.dataKey || 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={`${item.value}`}
              data-slot="chart-legend-item"
              // Figma Legend Item: gap-1.5 · 8px rounded-xs swatch (or 12px icon) · text-xs base/foreground.
              className="flex items-center gap-1.5 text-foreground [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:text-foreground"
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div className="size-2 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} />
              )}
              {itemConfig?.label ?? item.value}
            </div>
          )
        })}
    </div>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null ? payload.payload : undefined

  let configLabelKey: string = key

  if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string
  }

  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config]
}
