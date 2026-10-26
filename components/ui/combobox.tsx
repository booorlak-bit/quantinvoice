'use client'

import * as React from 'react'
import { Command as CommandPrimitive, useCommandState } from 'cmdk'
import { cva } from 'class-variance-authority'
import {
  IconCheckmark1Medium,
  IconChevronDownMedium,
  IconChevronGrabberVertical,
  IconMagnifyingGlass,
} from 'central-icons'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/*
 * Figma (Dropdown / Combobox / Context Menu / Menu Bar page):
 *   Combobox (16:33297)              — Type=Default | With Group Label × State=Default | Hover | Focus | Disabled | Pressed,
 *                                      booleans Label / Avatar / Description.
 *   Combobox / Menu Item (16:32917)  — Type=Simple | Icon | Avatar | Checkbox | Avatar +Checkbox × State=Default | Hover.
 *   Combobox / Search (16:32984) and the Command Menu panels — Simple (16:32987), Multiselect (16:32997),
 *   Avatars (16:33007), Avatars+Checkbox (16:33018), Groups (16:33031).
 *
 * shadcn's Combobox is a Popover + Command. The parts below are built on popover.tsx and command.tsx and restyle them
 * to the Figma Combobox menu (filled search pill, 32px rounded-lg items, p-1 groups). <Combobox> wires them up for
 * single and multiple selection from an options array.
 *
 * The Figma Label and Description are a Field: use <Field>, <FieldLabel> and <FieldDescription> from field.tsx
 * (spacing/2 gap · text-sm/leading-none/medium label · text-sm/leading-normal/medium base/muted-foreground description).
 */

// ─── Trigger ─────────────────────────────────────────────────────────────────────────────────────────────────────────

// Trigger: px-4 · py-2 · gap-2 · border-radius/rounded-lg · base/input fill · text-sm/leading-normal/medium base/foreground ·
// trailing 16px icon at opacity/opacity-50 in the text colour (Icon / ChevronsUpDown, or Icon / ChevronDown for
// Type=With Group Label). Avatar=True puts a 20px avatar (Avatar size 5) before the text.
//   Hover    custom/accent dark:input\50 fill · text (and icon) base/accent-foreground
//   Focus    base/input fill · border-1 (1.5px) base/ring inside stroke · focus/default ring — also while the menu is open
//   Pressed  custom/background dark:input\30 fill · opacity/opacity-60 · base/foreground text
//   Disabled base/input fill · opacity/opacity-50
export const comboboxTriggerVariants = cva(
  [
    'flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg bg-input px-4 py-2 text-left text-sm font-medium text-foreground outline-none transition-[color,background-color,box-shadow,opacity]',
    'hover:bg-custom-accent-dark-input-50 hover:text-accent-foreground',
    // Focus / open: inside stroke (an outline drawn inward) so the ring never shifts the layout.
    'focus-visible:bg-input focus-visible:text-foreground focus-visible:shadow-focus focus-visible:outline-(length:--border-1) focus-visible:-outline-offset-(length:--border-1) focus-visible:outline-ring focus-visible:outline-solid',
    'data-[state=open]:bg-input data-[state=open]:text-foreground data-[state=open]:shadow-focus data-[state=open]:outline-(length:--border-1) data-[state=open]:-outline-offset-(length:--border-1) data-[state=open]:outline-ring data-[state=open]:outline-solid',
    // Pressed comes after hover and focus in the stylesheet, so a real press shows the Figma Pressed look.
    'active:bg-custom-background-dark-input-30 active:text-foreground active:opacity-60',
    'disabled:pointer-events-none disabled:bg-input disabled:text-foreground disabled:opacity-50',
    // Not in Figma (shadcn form parity): invalid draws the stroke and ring in destructive.
    'aria-invalid:outline-(length:--border-1) aria-invalid:-outline-offset-(length:--border-1) aria-invalid:outline-destructive aria-invalid:outline-solid',
    'aria-invalid:focus-visible:shadow-focus-destructive aria-invalid:focus-visible:outline-destructive aria-invalid:data-[state=open]:shadow-focus-destructive aria-invalid:data-[state=open]:outline-destructive',
    // A leading icon (code-only; Figma shows an Avatar here) gets the 16px muted treatment of the other inputs.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
  ],
  {
    variants: {
      // Figma property Type. With Group Label stacks a text-xs/leading-normal/medium base/muted-foreground label
      // (spacing/0-5 gap) above the value, so the trigger grows from height/h-9 to height/h-12.
      type: {
        default: 'h-9',
        'with-group-label': 'h-12',
      },
    },
    defaultVariants: {
      type: 'default',
    },
  },
)

export type ComboboxTriggerType = 'default' | 'with-group-label'

/** The Figma "Trigger": opens the menu. Children are the value — an optional Avatar plus a <ComboboxValue>. */
export function ComboboxTrigger({
  className,
  groupLabel,
  icon,
  children,
  ...props
}: React.ComponentProps<'button'> & {
  /** Figma Type=With Group Label: a small label above the value (48px trigger with a ChevronDown). */
  groupLabel?: React.ReactNode
  /** Figma instance swap `icon`: replaces the trailing chevron (16px, 50% opacity). `null` hides it. */
  icon?: React.ReactNode
}) {
  const type: ComboboxTriggerType = groupLabel ? 'with-group-label' : 'default'
  const Icon = type === 'with-group-label' ? IconChevronDownMedium : IconChevronGrabberVertical
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        role="combobox"
        data-slot="combobox-trigger"
        data-type={type}
        className={cn(comboboxTriggerVariants({ type }), className)}
        {...props}
      >
        {groupLabel ? (
          <span data-slot="combobox-trigger-content" className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span data-slot="combobox-group-label" className="truncate text-xs font-medium text-muted-foreground">
              {groupLabel}
            </span>
            <span className="flex min-w-0 items-center gap-2">{children}</span>
          </span>
        ) : (
          children
        )}
        {icon === undefined ? (
          <Icon data-slot="combobox-icon" aria-hidden="true" className="ml-auto size-4 text-current opacity-50" />
        ) : (
          icon !== null && (
            <span
              data-slot="combobox-icon"
              aria-hidden="true"
              // Like the chevron, a swapped icon follows the text colour (beats the muted leading-icon rule).
              className="ml-auto flex shrink-0 text-current opacity-50 [&_svg:not([class*='text-'])]:text-current!"
            >
              {icon}
            </span>
          )
        )}
      </button>
    </PopoverTrigger>
  )
}

/** The trigger text. Shows `placeholder` (data-placeholder) when it has no children. Truncates with an ellipsis. */
export function ComboboxValue({
  className,
  placeholder,
  children,
  ...props
}: React.ComponentProps<'span'> & { placeholder?: React.ReactNode }) {
  const empty = children === undefined || children === null || children === '' || children === false
  return (
    <span
      data-slot="combobox-value"
      data-placeholder={empty || undefined}
      className={cn('min-w-0 flex-1 truncate', className)}
      {...props}
    >
      {empty ? placeholder : children}
    </span>
  )
}

// ─── Menu ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Command Menu panel: 250px · base/popover fill + backdrop-blur/md · border-radius/rounded-lg · shadow/lg · no padding
// (the search row and every group carry spacing/1). Figma draws no stroke; shadow/lg's 0 0 2px layer is the edge.
const comboboxPanelClassName = 'w-[250px] gap-0 overflow-hidden rounded-lg bg-popover p-0 text-popover-foreground shadow-lg backdrop-blur-md'

/** Command root without chrome: the panel (ComboboxContent or ComboboxMenu) draws the surface. */
export function ComboboxCommand({ className, ...props }: React.ComponentProps<typeof Command>) {
  return (
    <Command
      data-slot="combobox-command"
      className={cn('rounded-none border-0 bg-transparent text-popover-foreground shadow-none', className)}
      {...props}
    />
  )
}

/** Popover root. Same props as Radix Popover (open, defaultOpen, onOpenChange, modal). */
export function ComboboxRoot({ ...props }: React.ComponentProps<typeof Popover>) {
  return <Popover data-slot="combobox" {...props} />
}

/** Positions the menu against another element than the trigger. */
export function ComboboxAnchor({ ...props }: React.ComponentProps<typeof PopoverAnchor>) {
  return <PopoverAnchor data-slot="combobox-anchor" {...props} />
}

/** The floating Command Menu: a PopoverContent with a Command inside. Children are the menu parts. */
export function ComboboxContent({
  className,
  children,
  align = 'start',
  commandProps,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof PopoverContent> & {
  /** Props for the inner cmdk Command (filter, shouldFilter, loop, value …). */
  commandProps?: React.ComponentProps<typeof Command>
}) {
  return (
    <PopoverContent
      data-slot="combobox-content"
      align={align}
      className={cn(comboboxPanelClassName, className)}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event)
        if (event.defaultPrevented) return
        // Radix focuses the search field. Without one it would focus the popover itself, outside the cmdk root, so
        // arrow keys and Enter would never reach cmdk: focus the cmdk root instead.
        const content = event.currentTarget as HTMLElement | null
        if (!content || content.querySelector('[cmdk-input]')) return
        event.preventDefault()
        content.querySelector<HTMLElement>('[cmdk-root]')?.focus()
      }}
      {...props}
    >
      <ComboboxCommand tabIndex={-1} {...commandProps} className={cn('outline-none', commandProps?.className)}>
        {children}
      </ComboboxCommand>
    </PopoverContent>
  )
}

/** The same Command Menu panel rendered in place (no popover) — for inline lists and previews. */
export function ComboboxMenu({ className, ...props }: React.ComponentProps<typeof Command>) {
  return <Command data-slot="combobox-menu" className={cn(comboboxPanelClassName, 'border-0', className)} {...props} />
}

// Combobox / Search: spacing/1 around a 32px (height/h-8) base/input pill · px-3 · py-1 · gap-1 · rounded-lg ·
// Icon / Search 16px base/muted-foreground · text-sm/leading-normal/medium, placeholder base/muted-foreground.
export function ComboboxInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="combobox-input-wrapper" className="flex shrink-0 items-center p-1">
      <div className="flex h-8 w-full min-w-0 items-center gap-1 rounded-lg bg-input px-3 py-1 has-[input:disabled]:opacity-50">
        <IconMagnifyingGlass aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <CommandPrimitive.Input
          data-slot="combobox-input"
          className={cn(
            'h-full min-w-0 flex-1 truncate bg-transparent text-sm font-medium text-foreground outline-hidden',
            'placeholder:text-muted-foreground disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
      </div>
    </div>
  )
}

export function ComboboxList({ className, ...props }: React.ComponentProps<typeof CommandList>) {
  return <CommandList data-slot="combobox-list" className={cn('scroll-py-1', className)} {...props} />
}

export function ComboboxEmpty({ className, ...props }: React.ComponentProps<typeof CommandEmpty>) {
  return <CommandEmpty data-slot="combobox-empty" className={cn('text-muted-foreground', className)} {...props} />
}

// Group: spacing/1 padding. Heading = Command / Menu Heading (px-2 · py-1 · text-xs/leading-normal/medium
// base/muted-foreground), inherited from CommandGroup.
export function ComboboxGroup({ className, ...props }: React.ComponentProps<typeof CommandGroup>) {
  return <CommandGroup data-slot="combobox-group" className={cn('p-1', className)} {...props} />
}

// Figma closes every group but the last with a 1px base/border bottom stroke; a separator between groups draws the same line
// (CommandSeparator's -mt-px h-px base/border). cmdk's Separator is a role="separator", which a listbox may not contain
// (only options and groups), so this one is presentational. Like cmdk's, it hides while searching unless alwaysRender.
export function ComboboxSeparator({
  className,
  alwaysRender,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  const searching = useCommandState((state) => state.search !== '')
  if (searching && !alwaysRender) return null
  return (
    <div
      role="none"
      data-slot="combobox-separator"
      className={cn('-mt-px h-px shrink-0 bg-border', className)}
      {...props}
    />
  )
}

// Combobox / Menu Item: p-2 · gap-2 · border-radius/rounded-lg · text-sm/leading-normal/medium base/foreground.
// The master is 36px tall; every Command Menu but Avatars+Checkbox uses it at 32px (height/h-8), as here
// (className="h-9" gives the 36px row).
//   Type=Simple           label only
//   Type=Icon             leading 14px icon in base/muted-foreground (the first svg child, or the one after the checkbox)
//   Type=Avatar           leading 20px avatar (<Avatar size="5">)
//   Type=Checkbox         leading checkbox (indicator="checkbox") — the multi-select marker. It is drawn, not a <Checkbox>:
//                         a focusable control inside role="option" is a nested interactive element. The option carries
//                         the state (aria-checked); the box copies the Checkbox look (checkbox.tsx: 16px, 4px raw radius,
//                         base/border stroke on custom/background dark:input\30, Active base/primary with a 14px check).
//   Type=Avatar +Checkbox both
//   State=Hover           base/accent fill · base/accent-foreground text — cmdk's highlighted item (data-selected),
//                         forced in the docs with data-force="hover".
// Booleans: Selected → `checked` (trailing Icon / Check 16px) · Badge → a <Badge variant="secondary"> child after the
// label · Right Icon → a trailing svg child (16px, base/muted-foreground).
export function ComboboxItem({
  className,
  checked,
  indicator = 'check',
  children,
  ...props
}: React.ComponentProps<typeof CommandItem> & {
  /** Selected. Shows a trailing check (indicator="check") or ticks the leading checkbox (indicator="checkbox"). */
  checked?: boolean
  /** How `checked` is drawn: a trailing check (single select) or a leading checkbox (multi select). */
  indicator?: 'check' | 'checkbox'
}) {
  const isCheckbox = indicator === 'checkbox'
  return (
    <CommandItem
      data-slot="combobox-item"
      data-indicator={indicator}
      checked={isCheckbox ? undefined : checked}
      data-checked={checked || undefined}
      aria-checked={checked === undefined ? undefined : checked}
      className={cn(
        'h-8 rounded-lg py-0 font-medium',
        // Only the leading icon is 14px; a trailing Right Icon keeps CommandItem's 16px.
        "[&>svg:first-child:not([class*='size-'])]:size-3.5 [&>[data-slot=combobox-item-checkbox]+svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      {isCheckbox && (
        <span
          aria-hidden="true"
          data-slot="combobox-item-checkbox"
          data-state={checked ? 'checked' : 'unchecked'}
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-border bg-custom-background-dark-input-30',
            'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
          )}
        >
          {/* An explicit text colour: CommandItem mutes every svg without one. */}
          {checked && <IconCheckmark1Medium className="size-3.5 text-primary-foreground" />}
        </span>
      )}
      {children}
    </CommandItem>
  )
}

// ─── Combobox (single / multiple) ────────────────────────────────────────────────────────────────────────────────────

export interface ComboboxOption {
  value: string
  label: string
  /** Leading 14px icon (Figma Type=Icon). */
  icon?: React.ReactNode
  /** Leading 20px avatar (Figma Type=Avatar): an image src and/or fallback initials. */
  avatar?: { src?: string; fallback: string }
  /** Extra search terms. The label and value are always searchable. */
  keywords?: string[]
  disabled?: boolean
}

export interface ComboboxOptionGroup {
  /** Group heading (Figma Menu Heading). */
  label?: string
  options: ComboboxOption[]
}

interface ComboboxBaseProps {
  /** A flat list of options, or groups with headings (separated by a line). */
  options: ComboboxOption[] | ComboboxOptionGroup[]
  /** Trigger text when nothing is selected. */
  placeholder?: string
  /** Placeholder of the search field. */
  searchPlaceholder?: string
  /** Shown when the search matches nothing. */
  emptyText?: React.ReactNode
  /** Figma Type=With Group Label: a small label above the value in the trigger. */
  groupLabel?: React.ReactNode
  /** Hide the search field (for short lists). */
  searchable?: boolean
  /** Extra items after the options, in their own group (e.g. an "Add new" ComboboxItem). */
  footer?: React.ReactNode
  /** Replaces the trigger text. Receives the selected options. */
  renderValue?: (selected: ComboboxOption[]) => React.ReactNode
  disabled?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Classes for the trigger. */
  className?: string
  /** Classes for the menu panel. */
  contentClassName?: string
  id?: string
  name?: string
  'aria-invalid'?: React.AriaAttributes['aria-invalid']
  'aria-label'?: string
  'aria-describedby'?: string
}

export interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export interface ComboboxMultipleProps extends ComboboxBaseProps {
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps

function isGrouped(options: ComboboxOption[] | ComboboxOptionGroup[]): options is ComboboxOptionGroup[] {
  return options.length > 0 && 'options' in options[0]
}

function OptionAvatar({ avatar }: { avatar: NonNullable<ComboboxOption['avatar']> }) {
  return (
    <Avatar size="5" data-slot="combobox-avatar">
      {avatar.src && <AvatarImage src={avatar.src} alt="" />}
      <AvatarFallback>{avatar.fallback}</AvatarFallback>
    </Avatar>
  )
}

/**
 * A searchable select: trigger + Command Menu in a popover. Single selection shows a trailing check and closes the
 * menu; `multiple` shows checkboxes and keeps it open. Options with `avatar` / `icon` render the Avatar / Icon types.
 */
export function Combobox(props: ComboboxProps) {
  const {
    options,
    placeholder = 'Select…',
    searchPlaceholder = 'Search',
    emptyText = 'No results found.',
    groupLabel,
    searchable = true,
    footer,
    renderValue,
    disabled,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    className,
    contentClassName,
    id,
    name,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
  } = props
  const multiple = props.multiple === true

  const [openState, setOpenState] = React.useState(defaultOpen)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }

  const initial = props.defaultValue === undefined ? [] : Array.isArray(props.defaultValue) ? props.defaultValue : [props.defaultValue]
  const [valueState, setValueState] = React.useState<string[]>(initial)
  const controlled = props.value !== undefined
  const selectedValues: string[] = controlled
    ? Array.isArray(props.value)
      ? props.value
      : props.value
        ? [props.value]
        : []
    : valueState

  const groups: ComboboxOptionGroup[] = isGrouped(options) ? options : [{ options: options as ComboboxOption[] }]
  const all = groups.flatMap((g) => g.options)
  const selected = selectedValues.map((v) => all.find((o) => o.value === v)).filter((o): o is ComboboxOption => !!o)

  const commit = (next: string[]) => {
    if (!controlled) setValueState(next)
    if (props.multiple) props.onValueChange?.(next)
    else props.onValueChange?.(next[0] ?? '')
  }

  const toggle = (value: string) => {
    if (multiple) {
      commit(selectedValues.includes(value) ? selectedValues.filter((v) => v !== value) : [...selectedValues, value])
    } else {
      // Picking the current value again clears it (shadcn behaviour).
      commit(selectedValues[0] === value ? [] : [value])
      setOpen(false)
    }
  }

  const first = selected[0]
  const text = renderValue
    ? renderValue(selected)
    : selected.length === 0
      ? undefined
      : multiple
        ? selected.map((o) => o.label).join(', ')
        : first.label

  return (
    <ComboboxRoot open={open} onOpenChange={setOpen}>
      <ComboboxTrigger
        id={id}
        groupLabel={groupLabel}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={className}
      >
        {!renderValue && !groupLabel && first?.avatar && <OptionAvatar avatar={first.avatar} />}
        {!renderValue && !groupLabel && !first?.avatar && first?.icon}
        <ComboboxValue placeholder={placeholder}>{text}</ComboboxValue>
      </ComboboxTrigger>
      {name && <input type="hidden" name={name} value={selectedValues.join(',')} />}
      {/* Opening highlights (and scrolls to) the selected option instead of the first one. */}
      <ComboboxContent className={contentClassName} commandProps={{ defaultValue: selectedValues[0] }}>
        {searchable && <ComboboxInput placeholder={searchPlaceholder} />}
        <ComboboxList>
          <ComboboxEmpty>{emptyText}</ComboboxEmpty>
          {groups.map((group, i) => (
            <React.Fragment key={group.label ?? i}>
              {i > 0 && <ComboboxSeparator />}
              <ComboboxGroup heading={group.label}>
                {group.options.map((option) => (
                  <ComboboxItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label, ...(option.keywords ?? [])]}
                    disabled={option.disabled}
                    checked={selectedValues.includes(option.value)}
                    indicator={multiple ? 'checkbox' : 'check'}
                    onSelect={() => toggle(option.value)}
                  >
                    {option.avatar ? <OptionAvatar avatar={option.avatar} /> : option.icon}
                    <span>{option.label}</span>
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </React.Fragment>
          ))}
          {footer && (
            <>
              <ComboboxSeparator alwaysRender />
              <ComboboxGroup forceMount>{footer}</ComboboxGroup>
            </>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  )
}
