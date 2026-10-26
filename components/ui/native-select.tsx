import * as React from 'react'
import { IconChevronDownMedium } from 'central-icons'

import { cn } from '@/lib/utils'

// There is no Native Select in Figma: this is shadcn's NativeSelect (a styled <select>) dressed as the Figma Select
// trigger (18:862) so both look the same in a form.
// h-8 · pl-3 · pr-9 (room for the chevron) · rounded-lg · base/input fill · text-sm/leading-normal/medium base/foreground.
// Focus: 1px base/ring stroke inside the edge + focus/default. Error (aria-invalid): base/destructive stroke, and
// focus/destructive on focus. Disabled: opacity 50 + shadow/xs, like the Select trigger. Icon / ChevronDown 16px in
// base/muted-foreground, 12px from the right edge.
// size: `default` is the Figma trigger (h-8, rounded-lg); `sm` (h-7, rounded-md) is shadcn's compact size, the same as
// SelectTrigger size="sm". It replaces the native numeric `size` attribute, like shadcn.
export function NativeSelect({
  className,
  size = 'default',
  ...props
}: Omit<React.ComponentProps<'select'>, 'size'> & { size?: 'sm' | 'default' }) {
  return (
    <div
      data-slot="native-select-wrapper"
      className="group/native-select relative w-fit has-[select:disabled]:opacity-50"
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          'w-full min-w-0 appearance-none bg-input py-1 pr-9 pl-3 text-sm font-medium text-foreground outline-none transition-[color,box-shadow]',
          'data-[size=default]:h-8 data-[size=default]:rounded-lg data-[size=sm]:h-7 data-[size=sm]:rounded-md',
          'focus-visible:shadow-focus focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-ring focus-visible:outline-solid',
          'aria-invalid:outline-1 aria-invalid:-outline-offset-1 aria-invalid:outline-destructive aria-invalid:outline-solid',
          'aria-invalid:focus-visible:shadow-focus-destructive aria-invalid:focus-visible:outline-destructive',
          // The open list is drawn by the browser and follows the mode's color-scheme (set by the tokens).
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-xs',
          className,
        )}
        {...props}
      />
      <IconChevronDownMedium
        data-slot="native-select-icon"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground select-none"
      />
    </div>
  )
}

export function NativeSelectOption({ ...props }: React.ComponentProps<'option'>) {
  return <option data-slot="native-select-option" {...props} />
}

export function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<'optgroup'>) {
  return <optgroup data-slot="native-select-optgroup" className={cn(className)} {...props} />
}
