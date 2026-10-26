'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconCalendar1, IconChevronDownMedium } from 'central-icons'

import { cn } from '@/lib/utils'
import { Input, inputStateClasses } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Figma: Date Picker (16:38679) — State=Default | Hover | Focus | Pressed | Disabled × Type=Icon Left | With Input | Icon Right.
// A Popover whose trigger is the _DatePickerTrigger field and whose content is a Calendar (Calendar / Basic).
// The label and description around the field in Figma are Field / FieldLabel / FieldDescription.

/** Root. A Popover — pass `open` / `onOpenChange` to control it. */
export function DatePicker({ ...props }: React.ComponentProps<typeof Popover>) {
  return <Popover data-slot="date-picker" {...props} />
}

// _DatePickerTrigger: h-9 · rounded-lg · base/input fill · px-3 (py-2 / py-1 with an input) · gap-2 ·
// text-sm/leading-normal/medium in base/foreground, 16px icons.
// Hover: rgba(10,10,10,.05) overlay (alpha inverted/95) + base/accent-foreground text.
// Pressed: rgba(10,10,10,.1) overlay (alpha inverted/90) at 60% opacity.
// Focus: border-1 (1.5px) base/ring stroke + focus/default — the Input focus treatment. Disabled: 50%.
// Figma has no dark Date Picker and the alpha variables are not mode-aware: a black 5% overlay on the dark base/input
// (white 5%) is invisible, so dark mode mirrors the overlays to the matching white alphas (alpha/95 · alpha/90), as
// the OS toolbar and the selected Sidebar link do.
const datePickerFieldClasses = cn(
  'h-9 w-full min-w-0 rounded-lg bg-input text-sm font-medium text-foreground outline-none transition-[color,box-shadow,opacity]',
  'hover:bg-[image:linear-gradient(var(--alpha-inverted-95),var(--alpha-inverted-95))] hover:text-accent-foreground',
  'dark:hover:bg-[image:linear-gradient(var(--alpha-95),var(--alpha-95))]',
  'active:bg-[image:linear-gradient(var(--alpha-inverted-90),var(--alpha-inverted-90))] active:text-foreground active:opacity-60',
  'dark:active:bg-[image:linear-gradient(var(--alpha-90),var(--alpha-90))]',
  inputStateClasses,
  'disabled:pointer-events-none disabled:opacity-50',
)

export const datePickerTriggerVariants = cva(
  [
    datePickerFieldClasses,
    'flex items-center gap-2 overflow-hidden px-3 py-2 text-left',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      // Figma property Type (renamed: `type` is the native button attribute). Type=With Input is DatePickerInput.
      variant: {
        'icon-left': '',
        'icon-right': '',
      },
    },
    defaultVariants: { variant: 'icon-left' },
  },
)

/** The field that opens the calendar. Children are the formatted value or a placeholder. */
export function DatePickerTrigger({
  className,
  variant = 'icon-left',
  icon,
  children,
  ...props
}: React.ComponentProps<typeof PopoverTrigger> &
  VariantProps<typeof datePickerTriggerVariants> & {
    /** Replaces the Calendar icon (icon-left) or the ChevronDown (icon-right). */
    icon?: React.ReactNode
  }) {
  return (
    <PopoverTrigger
      data-slot="date-picker-trigger"
      data-variant={variant}
      className={cn(datePickerTriggerVariants({ variant }), className)}
      {...props}
    >
      {variant === 'icon-left' && (icon ?? <IconCalendar1 />)}
      <span data-slot="date-picker-value" className="min-w-0 flex-1 truncate">
        {children}
      </span>
      {variant === 'icon-right' && (icon ?? <IconChevronDownMedium />)}
    </PopoverTrigger>
  )
}

// Figma: Date Picker / Button (16:38416) — State=Default | Hover | Disabled.
// size-6 · rounded-md · 14px Calendar icon. Hover custom/accent dark:input\50 + base/accent-foreground. Disabled 50%.
export const datePickerButtonClasses = cn(
  'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-foreground outline-none transition-[color,background-color,box-shadow]',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  'hover:bg-custom-accent-dark-input-50 hover:text-accent-foreground',
  'focus-visible:shadow-focus',
  'disabled:pointer-events-none disabled:opacity-50',
)

/** The small calendar button inside DatePickerInput. Use it on its own wherever a 24px calendar toggle is needed. */
export function DatePickerButton({ className, children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button type="button" data-slot="date-picker-button" className={cn(datePickerButtonClasses, className)} {...props}>
      {children ?? <IconCalendar1 />}
    </button>
  )
}

/**
 * Type=With Input: a typed date field (pl-3 · pr-10 · py-1) with a Date Picker / Button at the end that opens the
 * calendar. The popover is anchored to the whole field. Props go to the <input>.
 */
export function DatePickerInput({
  className,
  disabled,
  buttonLabel = 'Open calendar',
  ...props
}: React.ComponentProps<typeof Input> & {
  /** Accessible name of the calendar button. */
  buttonLabel?: string
}) {
  return (
    <PopoverAnchor asChild>
      <div data-slot="date-picker-input" className="relative w-full">
        <Input
          disabled={disabled}
          className={cn(datePickerFieldClasses, 'py-1 pr-10 pl-3 placeholder:text-muted-foreground', className)}
          {...props}
        />
        <PopoverTrigger asChild disabled={disabled}>
          <DatePickerButton aria-label={buttonLabel} className="absolute top-1/2 right-2 -translate-y-1/2" />
        </PopoverTrigger>
      </div>
    </PopoverAnchor>
  )
}

/**
 * The floating panel. It hosts a Calendar, which draws the Figma Calendar / Basic surface itself
 * (rounded-lg · base/border · base/background · shadow/sm), so the panel adds no chrome of its own.
 * On open, focus goes to the calendar's focusable day — the selected date, else today, else the first day of the
 * month (react-day-picker gives that day tabindex=0) — as in the WAI-ARIA date picker dialog, so the arrow keys
 * work straight away. Without a calendar (or with `onOpenAutoFocus` prevented) Radix's default applies.
 * The panel is a role="dialog" with no visible title, so it is named "Choose date" unless you pass aria-label or
 * aria-labelledby.
 */
export function DatePickerContent({
  className,
  align = 'start',
  sideOffset = 4,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      data-slot="date-picker-content"
      align={align}
      sideOffset={sideOffset}
      aria-label={props['aria-labelledby'] ? undefined : 'Choose date'}
      className={cn('w-auto gap-0 rounded-lg bg-transparent p-0 shadow-none backdrop-blur-none', className)}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event)
        if (event.defaultPrevented || !(event.currentTarget instanceof HTMLElement)) return
        const day = event.currentTarget.querySelector<HTMLElement>('[data-slot=calendar-day-button][tabindex="0"]')
        if (!day) return
        event.preventDefault()
        day.focus()
      }}
      {...props}
    />
  )
}
