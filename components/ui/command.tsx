'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { IconCheckmark1Medium, IconCrossMedium, IconMagnifyingGlass } from 'central-icons'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Figma: Command (16:37098) — Variant=Suggestions | Empty, built from
// Command / Input (16:37116) — State=Default | Filled | Disabled,
// Command / Item / Default (16:37195) — Variant=Default | Icon · State=Default | Hover | Disabled · Selected=Yes | No,
// Command / Input/Command/Menu Heading (16:37085) and Command / Input/Command/Item/Separator (16:37241).

// Accessible name of the search field. cmdk always points the input's aria-labelledby at its own visually hidden
// <label>, whose text is the root's `label` prop (empty when unset), so an aria-label on the input is ignored. When
// no `label` is given, CommandInput reports its aria-label or placeholder up here (and CommandDialog its title as a
// last resort) so the root can fill that label.
const CommandLabelContext = React.createContext<((label: string | undefined) => void) | null>(null)
const CommandDialogTitleContext = React.createContext<string | undefined>(undefined)

// Command: base/popover fill · border (1px) base/border · border-radius/rounded-lg · shadow/md ·
// base/popover-foreground. Figma caps the panel at 512px (max-w-lg); width is left to the layout here.
export function Command({ className, label, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  const [inputLabel, setInputLabel] = React.useState<string>()
  return (
    <CommandLabelContext.Provider value={setInputLabel}>
      <CommandPrimitive
        data-slot="command"
        label={label ?? inputLabel}
        className={cn(
          'flex w-full flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md',
          className,
        )}
        {...props}
      />
    </CommandLabelContext.Provider>
  )
}

// Command / Input: h-12 (48px) · p-3 · gap-2 · bottom border (1px) base/border · transparent fill.
// Icon / Search 16px at opacity/opacity-50 · text-sm/leading-normal/normal — placeholder base/muted-foreground
// (State=Default), value base/popover-foreground (State=Filled) · trailing Icon / X 16px in base/muted-foreground,
// which clears the query. Figma draws State=Disabled like Filled (same border and search icon); like shadcn, code
// keeps the row and dims only the query text and the X to opacity/opacity-50 so the state stays visible.
export function CommandInput({
  className,
  value,
  defaultValue,
  onValueChange,
  clearable = true,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof CommandPrimitive.Input>, 'defaultValue'> & {
  /** Initial query when uncontrolled. */
  defaultValue?: string
  /** Shows the trailing X button that clears the query. */
  clearable?: boolean
}) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? '')

  // Name the field (see CommandLabelContext): aria-label, else the placeholder, else the CommandDialog title.
  const setLabel = React.useContext(CommandLabelContext)
  const dialogTitle = React.useContext(CommandDialogTitleContext)
  const name = props['aria-label'] || (typeof props.placeholder === 'string' && props.placeholder) || dialogTitle
  React.useLayoutEffect(() => {
    setLabel?.(name || undefined)
    return () => setLabel?.(undefined)
  }, [setLabel, name])
  const isControlled = value !== undefined
  const search = isControlled ? value : uncontrolled

  const setSearch = (next: string) => {
    if (!isControlled) setUncontrolled(next)
    onValueChange?.(next)
  }

  return (
    <div
      ref={wrapperRef}
      data-slot="command-input-wrapper"
      className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-transparent p-3"
    >
      <IconMagnifyingGlass aria-hidden="true" className="size-4 shrink-0 text-popover-foreground opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        value={search}
        onValueChange={setSearch}
        disabled={disabled}
        className={cn(
          'flex h-full min-w-0 flex-1 truncate bg-transparent text-sm text-popover-foreground outline-hidden',
          'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      {clearable && (
        <button
          type="button"
          data-slot="command-input-clear"
          aria-label="Clear search"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            setSearch('')
            wrapperRef.current?.querySelector<HTMLInputElement>('[data-slot=command-input]')?.focus()
          }}
          className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground outline-hidden disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4"
        >
          <IconCrossMedium aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// List height: the Figma Suggestions panel (two groups of three items, 312px) fits without scrolling.
export function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn('max-h-80 scroll-py-1 overflow-x-hidden overflow-y-auto', className)}
      {...props}
    />
  )
}

// CommandEmpty: py-6 · centred text-sm/leading-normal/normal in base/popover-foreground.
export function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm text-popover-foreground', className)}
      {...props}
    />
  )
}

// CommandGroup: px-2 · py-1. Command / Input/Command/Menu Heading: px-2 · py-1 (22px) ·
// text-xs/leading-normal/medium in base/muted-foreground.
export function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden px-2 py-1 text-foreground',
        '**:[[cmdk-group-heading]]:truncate **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

// Command / Input/Command/Item/Separator: a full-width 1px base/border line between groups. Figma's separator is
// 0px tall and draws its stroke 1px above itself (over the previous group's bottom padding), so it adds no height:
// -mt-px cancels the 1px line's layout height.
export function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('-mt-px h-px shrink-0 bg-border', className)}
      {...props}
    />
  )
}

// _CommandItem: px-2 · py-3 (42px) · gap-2 · border-radius/rounded-sm · text-sm/leading-normal/normal base/foreground.
// Variant=Icon: a leading 16px icon (base/muted-foreground) passed as a child, usually with a CommandShortcut.
// State=Hover: base/accent fill + base/accent-foreground text — cmdk marks the pointer/keyboard highlight with
// data-selected, so there is no CSS :hover rule (it would highlight two rows while navigating with the keyboard);
// the docs force it with data-force="hover". State=Disabled: opacity/opacity-50.
// Selected=Yes: trailing Icon / Check 16px in base/foreground (also on Hover) → the `checked` prop.
export const commandItemClassName = cn(
  'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-3 text-sm text-foreground outline-hidden select-none',
  'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
  '[&[data-force~=hover]]:bg-accent [&[data-force~=hover]]:text-accent-foreground',
  'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
  '[&>span:not([data-slot])]:min-w-0 [&>span:not([data-slot])]:flex-1 [&>span:not([data-slot])]:truncate',
)

export function CommandItem({
  className,
  checked,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  /** Figma Selected=Yes: shows a trailing check mark and sets data-checked / aria-checked. */
  checked?: boolean
}) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      data-checked={checked || undefined}
      aria-checked={checked === undefined ? undefined : checked}
      className={cn(commandItemClassName, className)}
      {...props}
    >
      {children}
      {checked && <IconCheckmark1Medium data-slot="command-item-indicator" aria-hidden="true" className="ml-auto size-4 text-foreground" />}
    </CommandPrimitive.Item>
  )
}

// Shortcut text: text-xs/leading-normal/normal in base/muted-foreground, pushed to the end of the row.
export function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn('ml-auto shrink-0 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

// Not in Figma: a loading row for async results, styled like CommandEmpty.
export function CommandLoading({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      data-slot="command-loading"
      className={cn('py-6 text-center text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

// CommandDialog: the Command in a modal, built on Dialog (dialog.tsx) like shadcn. The dialog supplies the
// floating surface (base/popover + backdrop-blur/2xl · 0.5px base/border · rounded-2xl · shadow/2xl), the
// custom/Overlay scrim, centring and motion; the Command inside drops its own chrome. Width is the Figma panel's
// 512px (max-w-lg). No close button by default: the input already has an X, and Esc closes the dialog. On close,
// focus returns to the element that had it when the palette opened.
export function CommandDialog({
  title = 'Command palette',
  description = 'Search for a command to run…',
  children,
  className,
  showCloseButton = false,
  commandProps,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  /** Accessible dialog title (visually hidden). */
  title?: string
  /** Accessible dialog description (visually hidden). */
  description?: string
  /** Classes for the dialog panel (DialogContent). */
  className?: string
  /** Renders the Dialog's X button in the top-right corner. */
  showCloseButton?: boolean
  /** Props for the inner Command (filter, loop, value …). */
  commandProps?: React.ComponentProps<typeof CommandPrimitive>
}) {
  // A palette is usually opened from a shortcut or a plain button, not a DialogTrigger, so Radix has no trigger to
  // refocus on close and focus would drop to <body>. Remember what had focus on open and return to it instead.
  const returnFocusRef = React.useRef<HTMLElement | null>(null)

  return (
    <Dialog {...props}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn('gap-0 overflow-hidden p-0 sm:max-w-lg', className)}
        onOpenAutoFocus={() => {
          const active = document.activeElement
          returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current
          returnFocusRef.current = null
          if (target?.isConnected) {
            event.preventDefault()
            target.focus()
          }
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CommandDialogTitleContext.Provider value={title}>
          <Command
            {...commandProps}
            className={cn('rounded-none border-0 bg-transparent shadow-none', commandProps?.className)}
          >
            {children}
          </Command>
        </CommandDialogTitleContext.Provider>
      </DialogContent>
    </Dialog>
  )
}
