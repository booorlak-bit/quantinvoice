'use client'

import * as React from 'react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { IconCheckmark1Medium, IconMinusMedium } from 'central-icons'

import { cn } from '@/lib/utils'

/*
 * Figma: Checkbox (16:26870) — Status=Active|Inactive · State=Default|Focus|Disabled|Pressed,
 * plus the booleans Show Text / Show Description and the text props Label Text / Description Text.
 *   Status → Radix `data-state` (checked / unchecked), State → CSS (`focus-visible:`, `active:`, `disabled:`).
 *   Show Text / Show Description → <CheckboxField> with <CheckboxFieldTitle> / <CheckboxFieldDescription>.
 *
 * Box: 16×16 · border-width/border · rounded 4px (raw value in Figma, no variable; the Default variants use 5px, every
 *   other state 4px — 4px everywhere so the corner does not jump on focus/press) · Icon / Check 14px. The Figma check
 *   symbol shows a Central Icons glyph (its Lucide vector is hidden); code uses lucide `Check` like the rest of the system.
 *   Inactive  custom/background dark:input\30 fill · base/border stroke
 *   Active    base/primary fill + stroke · check in base/primary-foreground
 *   Focus     focus/default ring · Inactive stroke becomes base/ring
 *   Pressed   Active drops to opacity/50 (Inactive is unchanged)
 *   Disabled  Active opacity/50 · Inactive opacity/60 · label text opacity/70 (description unchanged)
 */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer group/checkbox size-4 shrink-0 rounded-[4px] border border-border bg-custom-background-dark-input-30 text-primary-foreground outline-none transition-[box-shadow,opacity]',
        // Status=Active (indeterminate, a code-only state, is drawn the same way with a minus).
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
        // State=Focus
        'focus-visible:shadow-focus data-[state=unchecked]:not-aria-invalid:focus-visible:border-ring',
        // State=Pressed
        'data-[state=checked]:active:opacity-50 data-[state=indeterminate]:active:opacity-50',
        // State=Disabled
        'disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:disabled:opacity-50 data-[state=indeterminate]:disabled:opacity-50',
        // Error (shadcn) — focus/destructive ring + base/destructive stroke.
        'aria-invalid:border-destructive aria-invalid:shadow-focus-destructive aria-invalid:focus-visible:shadow-focus-destructive',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <IconCheckmark1Medium className="size-3.5 group-data-[state=indeterminate]/checkbox:hidden" />
        <IconMinusMedium className="hidden size-3.5 group-data-[state=indeterminate]/checkbox:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

// Field: the Figma component's text. spacing/2 between box and text, spacing/1-5 between label and description.
// The Figma root is a cursor-pointer button (a plain frame when disabled) and its Label Wrapper breaks long words.
// Label: text-sm/leading-none/medium base/foreground. Description: text-sm/leading-normal/normal base/muted-foreground.

/** A `<label>` wrapping a `<Checkbox>` and its text, so clicking the text toggles the checkbox. */
export function CheckboxField({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="checkbox-field"
      className={cn(
        'group/checkbox-field flex w-fit cursor-pointer items-start gap-2',
        'has-[[data-slot=checkbox]:disabled]:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
}

export function CheckboxFieldContent({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span data-slot="checkbox-field-content" className={cn('flex min-w-0 flex-col gap-1.5 break-words', className)} {...props} />
  )
}

export function CheckboxFieldTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="checkbox-field-title"
      className={cn(
        'text-sm leading-none font-medium text-foreground',
        'group-has-[[data-slot=checkbox]:disabled]/checkbox-field:opacity-70',
        className,
      )}
      {...props}
    />
  )
}

export function CheckboxFieldDescription({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="checkbox-field-description" className={cn('text-sm text-muted-foreground', className)} {...props} />
}
