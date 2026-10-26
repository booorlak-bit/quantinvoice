import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Figma: Input (18:5028) booleans `Show Icon` (left Icon / Search), `Right Icon` and `Hotkey` (⌘K Kbd).
// The group takes over the Input surface: h-8 · rounded-lg · base/input fill, gap-1 between addon and text,
// and the same Focus / Error / Disabled treatment as Input (driven by the inner control).
export function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        'group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg bg-input outline-none transition-[color,box-shadow]',
        'has-[>textarea]:h-auto has-[>textarea]:rounded-xl',
        'has-[>[data-align=inline-start]]:[&>input]:pl-1 has-[>[data-align=inline-end]]:[&>input]:pr-1',
        'has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-2',
        'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-2',
        // Focus (also forced in the docs with data-force="focus" on the group).
        'focus-visible:shadow-focus focus-visible:outline-(length:--border-1) focus-visible:-outline-offset-(length:--border-1) focus-visible:outline-ring focus-visible:outline-solid',
        'has-[[data-slot=input-group-control]:focus-visible]:shadow-focus has-[[data-slot=input-group-control]:focus-visible]:outline-(length:--border-1) has-[[data-slot=input-group-control]:focus-visible]:-outline-offset-(length:--border-1) has-[[data-slot=input-group-control]:focus-visible]:outline-ring has-[[data-slot=input-group-control]:focus-visible]:outline-solid',
        // Error / Error (Focus).
        'has-[[data-slot][aria-invalid=true]]:outline-(length:--border-1) has-[[data-slot][aria-invalid=true]]:-outline-offset-(length:--border-1) has-[[data-slot][aria-invalid=true]]:outline-destructive has-[[data-slot][aria-invalid=true]]:outline-solid',
        'has-[[data-slot][aria-invalid=true]]:focus-visible:shadow-focus-destructive',
        'has-[[data-slot][aria-invalid=true]:focus-visible]:shadow-focus-destructive',
        // Disabled: the whole surface (control and addons) at 50%, from a disabled control or data-disabled on the group.
        'has-[[data-slot=input-group-control]:disabled]:opacity-50 data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

// An addon holding an InputGroupButton (default size xs, 24px) pulls it in by spacing/2, so the button sits 4px from
// the edge (12px padding - 8px): the same inset as above and below it in the 32px group.
const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 text-sm font-medium text-muted-foreground select-none [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        'inline-start': 'order-first pl-3 has-[>button]:-ml-2',
        'inline-end': 'order-last pr-3 has-[>button]:-mr-2',
        'block-start': 'order-first w-full justify-start px-3 pt-2',
        'block-end': 'order-last w-full justify-start px-3 pb-2',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
)

export function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        e.currentTarget.parentElement?.querySelector<HTMLElement>('input, textarea')?.focus()
      }}
      {...props}
    />
  )
}

// shadcn's InputGroupButton, sized for the 32px group: a ghost Button by default.
const inputGroupButtonVariants = cva('flex items-center gap-2 text-sm shadow-none', {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-sm px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
      sm: 'h-7 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5',
      'icon-xs': 'size-6 rounded-sm p-0 has-[>svg]:p-0',
      'icon-sm': 'size-7 rounded-md p-0 has-[>svg]:p-0',
    },
  },
  defaultVariants: {
    size: 'xs',
  },
})

export function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> & VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

export function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm font-medium text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

export function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'flex-1 rounded-none bg-transparent shadow-none focus-visible:shadow-none focus-visible:outline-none aria-invalid:outline-none aria-invalid:focus-visible:shadow-none aria-invalid:focus-visible:outline-none disabled:opacity-100',
        className,
      )}
      {...props}
    />
  )
}

export function InputGroupTextarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        'flex-1 resize-none rounded-none bg-transparent shadow-none aria-invalid:shadow-none focus-visible:shadow-none focus-visible:outline-none aria-invalid:outline-none aria-invalid:focus-visible:shadow-none aria-invalid:focus-visible:outline-none disabled:opacity-100',
        className,
      )}
      {...props}
    />
  )
}

export { inputGroupAddonVariants, inputGroupButtonVariants }
