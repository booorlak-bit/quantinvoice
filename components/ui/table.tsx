'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * Figma: Table (20:48940) — Size=default | md | lg.
 *   Table / Head (20:48908) — Right Text Align=No|Yes · State=Default|Hover.
 *   Table / Cell (20:47834) — Variant=Default|Badge|Avatar|Switch|Button|Dropdown|Progress|Image|Input|Toggle Group ·
 *     Size=Default|md|lg · State=Default|Hover · Last Cell=No|Yes · Right Text Align=No|Yes · Bold Text=No|Yes.
 *
 * How the Figma properties map to code:
 *   Size              → `size` on <Table> (inherited by every body cell) or on a single <TableCell>.
 *   Right Text Align  → `align="right"` on <TableHead> / <TableCell>.
 *   State=Hover       → `hover:` on <TableRow> (the whole row is tinted, header rows included).
 *   Last Cell=Yes     → structural: the last body row has no bottom border.
 *   Variant / Bold Text → cell content (Badge, Avatar, Switch, Button…; title + description), composed as children.
 *
 * Head: h-10 · px-2 · text-sm/leading-normal/medium · base/muted-foreground · border-b base/border.
 * Cell: px-2 · text-sm/leading-normal/medium · base/foreground · border-b base/border; height 52 / 72 / 96 by size.
 *   Figma's cell is a fixed-height frame with p-2, so taller content simply eats into the vertical padding (the 40px
 *   Image at Size=Default sits 6px from each edge; two-line Bold Text fills 36 + 16). A CSS cell grows instead, so the
 *   vertical padding is only spacing/1 (py-1) and align-middle centres the content: every Figma variant keeps its
 *   exact row height, and content taller than the row still gets 4px of air.
 * Hover: base/muted under white 50% → bg-muted/50. Footer: the same tint. Caption: spacing/4 above, text-sm/normal muted.
 */

type TableSize = 'default' | 'md' | 'lg'

const TableSizeContext = React.createContext<TableSize>('default')

export function Table({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'table'> & {
  /** Body row height: default 52px · md 72px · lg 96px (Figma `Size`). The footer always stays at default. */
  size?: TableSize
}) {
  return (
    <TableSizeContext.Provider value={size}>
      <div data-slot="table-container" className="relative w-full overflow-x-auto">
        <table
          data-slot="table"
          data-size={size}
          className={cn('w-full caption-bottom text-sm text-foreground', className)}
          {...props}
        />
      </div>
    </TableSizeContext.Provider>
  )
}

export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />
}

export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  // Figma `Last Cell=Yes`: the last row drops its bottom border.
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    // Figma "Footer": cells keep the default 52px height whatever the table size.
    <TableSizeContext.Provider value="default">
      <tfoot
        data-slot="table-footer"
        className={cn('border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
        {...props}
      />
    </TableSizeContext.Provider>
  )
}

export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-border transition-colors',
        // Figma State=Hover on Table / Head and Table / Cell: base/muted with a white 50% overlay.
        'hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

const tableHeadVariants = cva(
  [
    'h-10 px-2 align-middle text-sm font-medium whitespace-nowrap text-muted-foreground',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // A selection checkbox sits on spacing/3 with no right padding (Figma "Data Table / TableHead", Variant=Checkbox);
    // as a block it is centred by align-middle instead of sitting on the text baseline.
    '[&:has([role=checkbox])]:w-8 [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-3 [&>[role=checkbox]]:block',
  ],
  {
    variants: {
      align: {
        left: 'text-left',
        right: 'text-right',
      },
    },
    defaultVariants: {
      align: 'left',
    },
  },
)

export function TableHead({
  className,
  align = 'left',
  ...props
}: Omit<React.ComponentProps<'th'>, 'align'> & VariantProps<typeof tableHeadVariants>) {
  return <th data-slot="table-head" data-align={align} className={cn(tableHeadVariants({ align }), className)} {...props} />
}

const tableCellVariants = cva(
  [
    'px-2 py-1 align-middle text-sm font-medium whitespace-nowrap text-foreground',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Figma "Data Table / TableCell", Variant=Checkbox: spacing/3 on the left, nothing on the right.
    '[&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-3 [&>[role=checkbox]]:block',
  ],
  {
    variants: {
      size: {
        default: 'h-[52px]',
        md: 'h-[72px]',
        lg: 'h-24',
      },
      align: {
        left: 'text-left',
        right: 'text-right',
      },
    },
    defaultVariants: {
      size: 'default',
      align: 'left',
    },
  },
)

export function TableCell({
  className,
  size,
  align = 'left',
  ...props
}: Omit<React.ComponentProps<'td'>, 'align'> & VariantProps<typeof tableCellVariants>) {
  const tableSize = React.useContext(TableSizeContext)
  const resolvedSize = size ?? tableSize
  return (
    <td
      data-slot="table-cell"
      data-size={resolvedSize}
      data-align={align}
      className={cn(tableCellVariants({ size: resolvedSize, align }), className)}
      {...props}
    />
  )
}

export function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
}

export { tableHeadVariants, tableCellVariants }
