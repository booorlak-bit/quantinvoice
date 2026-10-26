'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconChevronDownMedium, IconChevronLeftMedium, IconChevronRightMedium } from 'central-icons'
import {
  DayPicker,
  getDefaultClassNames,
  type Chevron as DayPickerChevron,
  type DayButton,
  type Root as DayPickerRoot,
  type WeekNumber as DayPickerWeekNumber,
} from 'react-day-picker'

import { cn } from '@/lib/utils'
import { buttonVariants, type Button } from '@/components/ui/button'

// Figma: Calendar / Basic (16:10094) — rounded-lg · base/border 1px · base/background · shadow/sm · p-3.
// Months sit gap-4 apart (stacked under md — the Mobile=Yes variants), caption → grid gap-4,
// weekday row → weeks gap-2. `size` is the Figma Size property of Calendar / Day Button:
// default 32px cells, md 48px cells (Calendar / Custom Day Button).
// The 1px stroke is an inside stroke in Figma (248px wide = 7 × 32 + 2 × 12), so it is an inset ring, not a border.
export const calendarVariants = cva(
  [
    'group/calendar relative w-fit rounded-lg bg-background p-3 text-foreground shadow-sm inset-ring inset-ring-border',
    // Inside a shadcn Popover the popover draws the surface.
    '[[data-slot=popover-content]_&]:rounded-none [[data-slot=popover-content]_&]:bg-transparent [[data-slot=popover-content]_&]:shadow-none [[data-slot=popover-content]_&]:inset-ring-0',
    // Right-to-left calendars (e.g. Persian) mirror the navigation chevrons.
    String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
    String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
  ],
  {
    variants: {
      size: {
        default: '[--cell-size:--spacing(8)]',
        md: '[--cell-size:--spacing(12)]',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

// Figma: Calendar / Arrow Button (16:9897) — Type=Default | Outline × Variant=Previous | Next × State.
// size-8 · rounded-md · 16px chevron. Hover custom/accent dark:calendar\50 + base/accent-foreground,
// Focus focus/default, Disabled 50%. Outline adds a 1px base/input stroke on custom/background dark:calendar\30
// with shadow/xs. The figma Type is exposed as Calendar's shadcn `buttonVariant` ("ghost" = Type=Default). Other Button
// variants are not Figma arrow types: they keep shadcn's API and fall back to that Button variant at the arrow's size.
export const calendarArrowButtonVariants = cva(
  [
    'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground outline-none select-none transition-[color,background-color,box-shadow]',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    'hover:bg-custom-accent-dark-calendar-50 hover:text-accent-foreground',
    'focus-visible:shadow-focus',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
  ],
  {
    variants: {
      type: {
        default: 'disabled:bg-custom-background-dark-calendar-30 aria-disabled:bg-custom-background-dark-calendar-30',
        outline: 'border border-input bg-custom-background-dark-calendar-30 shadow-xs',
      },
    },
    defaultVariants: { type: 'default' },
  },
)

// Figma: Calendar / Day Button (16:9752) and Calendar / Custom Day Button (16:10003).
// Variant (Outside | Default | Current | Range | Unavailable) comes from the day's modifiers; State is CSS:
// Hover → hover:, Selected → data-selected, Selected (Focus) → focus-visible:, Disabled → disabled:.
// Rounded=Left/Right is the range edge: the first/last cell of a week, or the start/end of the range
// (see `day` / `range_start` / `range_end` in Calendar's classNames).
// text-sm/leading-normal/medium; custom content (number + extra <span>) switches to the leading-none/normal
// styles with the extra line in text-xs at 70%.
export const calendarDayButtonVariants = cva(
  [
    'relative flex size-(--cell-size) flex-col items-center justify-center gap-1 rounded-md text-sm font-medium text-foreground outline-none select-none',
    'has-[>span]:leading-none has-[>span]:font-normal [&>span]:text-xs [&>span]:leading-none [&>span]:opacity-70',
    'hover:bg-custom-accent-dark-calendar-50 hover:text-accent-foreground',
    'data-[selected=true]:rounded-md data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
    'focus-visible:z-10 focus-visible:shadow-focus',
    'disabled:pointer-events-none disabled:text-muted-foreground disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        // Custom Day Button · Default · Disabled keeps base/foreground (the plain Day Button turns muted).
        default: 'disabled:has-[>span]:text-foreground',
        outside: 'text-muted-foreground [&>span]:opacity-100',
        current: 'bg-accent text-accent-foreground',
        range: 'rounded-none bg-accent text-accent-foreground',
        unavailable: 'font-normal text-muted-foreground line-through disabled:opacity-100',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type CalendarDayVariant = NonNullable<VariantProps<typeof calendarDayButtonVariants>['variant']>

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  size = 'default',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> &
  VariantProps<typeof calendarVariants> & {
    /**
     * Style of the previous / next buttons. Figma Calendar / Arrow Button Type: "ghost" = Default, "outline" = Outline.
     * Any other Button variant (shadcn parity) draws that Button variant at the 32px arrow size.
     */
    buttonVariant?: React.ComponentProps<typeof Button>['variant']
  }) {
  const defaultClassNames = getDefaultClassNames()
  const arrowClassName =
    !buttonVariant || buttonVariant === 'ghost' || buttonVariant === 'outline'
      ? calendarArrowButtonVariants({ type: buttonVariant === 'outline' ? 'outline' : 'default' })
      : cn(buttonVariants({ variant: buttonVariant, size: 'icon' }), 'rounded-md')
  const withDropdowns = captionLayout !== 'label'

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(calendarVariants({ size }), className)}
      captionLayout={captionLayout}
      formatters={{
        // Figma shows the short month ("Jan") in the month select; follow the calendar's locale.
        formatMonthDropdown: (month, dateLib) =>
          dateLib ? dateLib.format(month, 'LLL') : month.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          withDropdowns ? 'h-8.5' : 'h-8',
          defaultClassNames.nav,
        ),
        button_previous: cn(arrowClassName, 'z-10', defaultClassNames.button_previous),
        button_next: cn(arrowClassName, 'z-10', defaultClassNames.button_next),
        month_caption: cn('flex min-h-8 w-full items-center justify-center px-8', defaultClassNames.month_caption),
        // Figma: With Month and Year Dropdown / Item (16:10830) — two selects gap-1.5.
        dropdowns: cn('flex w-full items-center justify-center gap-1.5 text-sm', defaultClassNames.dropdowns),
        // _SelectTrigger: 1px base/input stroke on custom/background dark:calendar\30, rounded-md, shadow/xs.
        dropdown_root: cn(
          'relative rounded-md border border-input bg-custom-background-dark-calendar-30 shadow-xs',
          'has-[select:focus-visible]:border-ring has-[select:focus-visible]:shadow-focus',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn('absolute inset-0 cursor-pointer bg-popover opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'select-none',
          withDropdowns
            ? 'flex h-8 items-center gap-1 px-2 text-sm font-normal text-foreground [&>svg]:size-4 [&>svg]:text-muted-foreground'
            : 'text-sm font-medium text-foreground',
          defaultClassNames.caption_label,
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        // Figma: Calendar / Day Header (16:9606) — text-xs/leading-normal/normal, base/muted-foreground.
        weekday: cn(
          'flex h-5 w-(--cell-size) flex-1 items-center justify-center rounded-md text-xs font-normal text-muted-foreground select-none',
          defaultClassNames.weekday,
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn('w-(--cell-size) select-none', defaultClassNames.week_number_header),
        // Figma: Calendar / Week Number (16:9841) — text-sm/leading-normal/normal, base/muted-foreground at 50%.
        week_number: cn('text-sm font-normal text-muted-foreground opacity-50 select-none', defaultClassNames.week_number),
        day: cn(
          'group/day relative size-(--cell-size) p-0 text-center select-none',
          // Rounded=Left/Right: a range breaks at the edges of a week.
          '[&:first-child[data-selected=true]]:rounded-l-md [&:last-child[data-selected=true]]:rounded-r-md',
          '[&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md',
          defaultClassNames.day,
        ),
        // The base/accent band behind the selected ends of a range (Variant=Range, State=Selected).
        range_start: cn('rounded-l-md bg-accent', defaultClassNames.range_start),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('rounded-r-md bg-accent', defaultClassNames.range_end),
        today: defaultClassNames.today,
        outside: defaultClassNames.outside,
        disabled: defaultClassNames.disabled,
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: CalendarRoot,
        Chevron: CalendarChevron,
        DayButton: CalendarDayButton,
        WeekNumber: CalendarWeekNumber,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarRoot({ className, rootRef, ...props }: React.ComponentProps<typeof DayPickerRoot>) {
  return <div data-slot="calendar" ref={rootRef} className={className} {...props} />
}

function CalendarChevron({ className, orientation }: React.ComponentProps<typeof DayPickerChevron>) {
  if (orientation === 'left') return <IconChevronLeftMedium className={cn('size-4', className)} />
  if (orientation === 'right') return <IconChevronRightMedium className={cn('size-4', className)} />
  return <IconChevronDownMedium className={cn('size-4', className)} />
}

function CalendarWeekNumber({ children, week: _week, ...props }: React.ComponentProps<typeof DayPickerWeekNumber>) {
  return (
    <td data-slot="calendar-week-number" {...props}>
      <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
    </td>
  )
}

/** Figma Variant of a day, derived from its react-day-picker modifiers. */
export function getCalendarDayVariant(modifiers: Record<string, boolean>): CalendarDayVariant {
  if (modifiers.range_start || modifiers.range_end || modifiers.range_middle) return 'range'
  if (modifiers.unavailable) return 'unavailable'
  if (modifiers.outside) return 'outside'
  if (modifiers.today) return 'current'
  return 'default'
}

// Figma: With time presets / Item (16:10867) — State=Default | Hover | Selected. A shadcn Button restyled for the
// preset column next to a calendar: h-9 · px-4 · py-2 · gap-2 · rounded-md · 1px stroke · no shadow ·
// text-sm/leading-normal/medium. Fills the column it sits in (108.5px in Figma).
//   Default   base/input stroke on custom/background dark:calendar\30 · base/foreground text
//   Hover     custom/accent dark:calendar\50 fill · base/accent-foreground text (stroke stays base/input)
//   Selected  base/primary fill and stroke · base/primary-foreground text → the `selected` prop (data-selected, aria-pressed)
// Not in Figma: Pressed is the resting look at 80% (like Button), Disabled is 50%, and Focus follows Button: the
// focus/default ring, plus a base/ring stroke on the unselected (outline-like) preset — its own 1px border, so no shift.
export const calendarPresetVariants = cva([
  'inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-custom-background-dark-calendar-30 px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground outline-none select-none transition-[color,background-color,border-color,box-shadow,opacity]',
  'data-[selected=true]:border-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
  // Hover never covers the selected look; a real press drops the hover fill (active comes after hover).
  'hover:not-data-[selected=true]:bg-custom-accent-dark-calendar-50 hover:not-data-[selected=true]:text-accent-foreground',
  'active:opacity-80 active:not-data-[selected=true]:bg-custom-background-dark-calendar-30 active:not-data-[selected=true]:text-foreground',
  'focus-visible:shadow-focus focus-visible:not-data-[selected=true]:border-ring',
  'disabled:pointer-events-none disabled:opacity-50',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
])

/** A preset button (e.g. a time) for the column next to a Calendar. `selected` marks the current preset. */
export function CalendarPreset({
  className,
  selected = false,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & {
  /** Figma State=Selected: base/primary fill. Sets data-selected and aria-pressed. */
  selected?: boolean
}) {
  return (
    <button
      type={type}
      data-slot="calendar-preset"
      data-selected={selected}
      aria-pressed={selected}
      className={cn(calendarPresetVariants(), className)}
      {...props}
    />
  )
}

export function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const variant = getCalendarDayVariant(modifiers)
  // State=Selected: a single selected date or either end of a range (the middle of a range is Variant=Range).
  const selected = Boolean(modifiers.range_start || modifiers.range_end || (modifiers.selected && !modifiers.range_middle))

  return (
    <button
      ref={ref}
      data-slot="calendar-day-button"
      data-day={day.date.toLocaleDateString()}
      data-variant={variant}
      data-selected={selected || undefined}
      // shadcn's day button attributes, so stock classNames / className overrides keep matching.
      data-selected-single={modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(calendarDayButtonVariants({ variant }), className)}
      {...props}
    />
  )
}
