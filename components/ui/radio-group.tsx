'use client'

import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconCirclePlaceholderOn } from 'central-icons'

import { cn } from '@/lib/utils'

/*
 * Figma: Radio Group page (18:2467) — two components.
 *   Radio Group (18:2472)  a vertical stack of Radio / Items, spacing/3 apart → <RadioGroup>.
 *   Radio / Item (18:2530) Active=Off|On · Type=Default|Box · Font Weight=Medium|Regular · State=Default|Focus,
 *                          plus the booleans Show Text / Show Description and the text props.
 *     Active      → Radix `data-state` (checked / unchecked) on <RadioGroupItem>
 *     State       → CSS (`focus-visible:`)
 *     Type        → `type` on <RadioGroupField>, the <label> drawn around the radio in Figma
 *     Font Weight → `fontWeight` on <RadioGroupField>
 *     Show Text / Show Description → <RadioGroupFieldTitle> / <RadioGroupFieldDescription>
 */

// Inside a RadioGroupField the <label> wraps the radio, its title and its description, so by default the radio's
// accessible name would be all of that text. The title and description register their ids with the field instead:
// the radio is named by the title (aria-labelledby) and described by the description (aria-describedby).
type RadioGroupFieldText = {
  titleId?: string
  descriptionId?: string
  setTitleId: (id: string | undefined) => void
  setDescriptionId: (id: string | undefined) => void
}
const RadioGroupFieldContext = React.createContext<RadioGroupFieldText | null>(null)

function useFieldTextId(id: string | undefined, part: 'title' | 'description') {
  const autoId = React.useId()
  const resolved = id ?? autoId
  const field = React.useContext(RadioGroupFieldContext)
  const register = part === 'title' ? field?.setTitleId : field?.setDescriptionId
  React.useLayoutEffect(() => {
    if (!register) return
    register(resolved)
    return () => register(undefined)
  }, [register, resolved])
  return resolved
}

export function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn('grid gap-3', className)} {...props} />
}

/*
 * Radio: 16×16 · rounded-full.
 *   Off    custom/background dark:input\30 fill · border-width/border base/border stroke · shadow/sm
 *   On     base/primary fill · border-width/border-3 base/primary stroke · 8px Icon / Circle in base/primary-foreground
 *   Focus  focus/default ring in place of shadow/sm · the Off stroke becomes base/ring
 *   Disabled / invalid are not in Figma — they follow shadcn (opacity 50%; focus/destructive ring, plus the
 *   base/destructive stroke while unchecked).
 */
export function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  const field = React.useContext(RadioGroupFieldContext)
  // A caller's aria-label / aria-labelledby wins over the field title.
  const ownName = Boolean(props['aria-label'] || props['aria-labelledby'])
  const titleId = ownName ? undefined : field?.titleId
  return (
    <RadioGroupPrimitive.Item
      aria-labelledby={titleId}
      aria-describedby={ownName || titleId ? field?.descriptionId : undefined}
      data-slot="radio-group-item"
      className={cn(
        'peer relative inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-custom-background-dark-input-30 text-primary-foreground shadow-sm outline-none transition-[box-shadow,opacity]',
        // Active=On
        'data-[state=checked]:border-3 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:shadow-none',
        // State=Focus (the stacked variant keeps the ring on top of the checked shadow-none)
        'focus-visible:shadow-focus data-[state=checked]:focus-visible:shadow-focus data-[state=unchecked]:not-aria-invalid:focus-visible:border-ring',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Error (shadcn) — focus/destructive ring in every state; base/destructive stroke while unchecked (checked keeps
        // the primary disc, like Checkbox). Stacked so it beats the checked shadow-none and the focus ring.
        'aria-invalid:border-destructive aria-invalid:shadow-focus-destructive',
        'aria-invalid:data-[state=checked]:border-primary aria-invalid:data-[state=checked]:shadow-focus-destructive aria-invalid:data-[state=checked]:focus-visible:shadow-focus-destructive',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center">
        <IconCirclePlaceholderOn className="size-2 fill-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

/*
 * Field: the Figma component's text + layout. spacing/3 between radio and text.
 *   Type=Box  spacing/3 padding · rounded-lg · custom/accent dark:input\50 fill.
 *             Checked: base/primary under an alpha/10 (white 90%) overlay + 1px base/primary inside stroke (an inset
 *             ring, so like in Figma it does not add to the padding). Figma's overlay is alpha/10 (white 90%) in both
 *             modes, which makes the text unreadable in dark. Code overlays base/background at 90% instead: identical to
 *             alpha/10 in light (background is white) and a 10% primary tint over the dark surface in dark — a token that
 *             follows the mode, so a .light island inside .dark (or the reverse) still gets the right tint.
 */
const radioGroupFieldVariants = cva(
  [
    'group/radio-group-field flex cursor-pointer items-start gap-3',
    'has-[[data-slot=radio-group-item]:disabled]:cursor-not-allowed',
  ],
  {
    variants: {
      type: {
        default: '',
        box: [
          'rounded-lg bg-custom-accent-dark-input-50 p-3',
          'has-[[data-slot=radio-group-item][data-state=checked]]:bg-primary has-[[data-slot=radio-group-item][data-state=checked]]:inset-ring has-[[data-slot=radio-group-item][data-state=checked]]:inset-ring-primary',
          'has-[[data-slot=radio-group-item][data-state=checked]]:bg-linear-to-b has-[[data-slot=radio-group-item][data-state=checked]]:from-background/90 has-[[data-slot=radio-group-item][data-state=checked]]:to-background/90',
        ],
      },
      fontWeight: {
        medium: '',
        regular: '',
      },
    },
    defaultVariants: {
      type: 'default',
      fontWeight: 'medium',
    },
  },
)

/** A `<label>` wrapping a `<RadioGroupItem>` and its text, so clicking anywhere on it selects the radio. */
export function RadioGroupField({
  className,
  type = 'default',
  fontWeight = 'medium',
  ...props
}: React.ComponentProps<'label'> & VariantProps<typeof radioGroupFieldVariants>) {
  const [titleId, setTitleId] = React.useState<string>()
  const [descriptionId, setDescriptionId] = React.useState<string>()
  const text = React.useMemo(() => ({ titleId, descriptionId, setTitleId, setDescriptionId }), [titleId, descriptionId])
  return (
    <RadioGroupFieldContext.Provider value={text}>
      <label
        data-slot="radio-group-field"
        data-type={type}
        data-font-weight={fontWeight}
        className={cn(radioGroupFieldVariants({ type, fontWeight }), className)}
        {...props}
      />
    </RadioGroupFieldContext.Provider>
  )
}

// Label Wrapper: spacing/1-5 between title and description, 1px top padding to line the title up with the radio.
// Figma breaks long words ([word-break:break-word]).
export function RadioGroupFieldContent({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="radio-group-field-content"
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1.5 pt-px break-words',
        'group-has-[[data-slot=radio-group-item]:disabled]/radio-group-field:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

// Title: text-sm/leading-none/medium base/foreground. Font Weight=Regular → font-normal. Names the radio.
export function RadioGroupFieldTitle({ className, id, ...props }: React.ComponentProps<'span'>) {
  const titleId = useFieldTextId(id, 'title')
  return (
    <span
      id={titleId}
      data-slot="radio-group-field-title"
      className={cn(
        'text-sm leading-none font-medium text-foreground',
        'group-data-[font-weight=regular]/radio-group-field:font-normal',
        className,
      )}
      {...props}
    />
  )
}

// Description: text-sm/leading-normal/medium base/muted-foreground. Font Weight=Regular → font-normal. Describes
// the radio.
export function RadioGroupFieldDescription({ className, id, ...props }: React.ComponentProps<'span'>) {
  const descriptionId = useFieldTextId(id, 'description')
  return (
    <span
      id={descriptionId}
      data-slot="radio-group-field-description"
      className={cn(
        'text-sm font-medium text-muted-foreground',
        'group-data-[font-weight=regular]/radio-group-field:font-normal',
        className,
      )}
      {...props}
    />
  )
}

export { radioGroupFieldVariants }
