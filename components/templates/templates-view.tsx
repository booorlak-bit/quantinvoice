'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconDotGrid1x3Horizontal, IconLayersTwo, IconPencil, IconPlusMedium, IconSquareBehindSquare1, IconTrashCan } from 'central-icons'

import { deleteTemplateAction, duplicateTemplateAction } from '@/app/(app)/templates/actions'
import { STYLE_OPTIONS } from '@/components/invoices/style-picker'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatMoney, sumItems } from '@/lib/format'
import type { InvoiceItem, InvoiceStyle } from '@/lib/types'
import { cn } from '@/lib/utils'

export type TemplateCard = {
  id: string
  name: string
  serviceType: string | null
  description: string | null
  style: InvoiceStyle
  currency: string | null
  items: InvoiceItem[]
  invoiceCount: number
}

/** A small invoice drawn in the template's own style: its theme island, title, first items and total. */
export function TemplatePreview({ template, className }: { template: Pick<TemplateCard, 'name' | 'style' | 'items' | 'currency'>; className?: string }) {
  const total = formatMoney(sumItems(template.items), template.currency ?? 'USD')
  const rows = template.items.slice(0, 3)
  if (template.style === 'quantum') {
    return (
      <div aria-hidden="true" className={cn('flex flex-col gap-2 bg-muted p-4 text-foreground', className)}>
        <span className="size-4 shrink-0 rounded-sm bg-foreground" />
        <span className="shrink-0 truncate text-sm font-semibold">{template.name}</span>
        <div className="mt-auto flex flex-col gap-1 text-[10px] text-muted-foreground">
          {rows.map((item, index) => (
            <span key={index} className="truncate">
              {item.title}
            </span>
          ))}
        </div>
        <span className="text-xs font-semibold tabular-nums">{total}</span>
      </div>
    )
  }
  const dark = template.style === 'dark' || template.style === 'alt-dark'
  const alt = template.style === 'alt-light' || template.style === 'alt-dark'
  return (
    <div aria-hidden="true" data-theme={alt ? 'alt' : 'osds'} className={cn(dark ? 'dark' : 'light', 'bg-muted p-3', className)}>
      <div className="flex h-full flex-col gap-2 rounded-md bg-card p-3 text-card-foreground shadow-xs">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-primary" />
          <span className="h-1 w-10 rounded-full bg-muted-foreground/40" />
        </div>
        <span className="shrink-0 truncate text-sm font-semibold">{template.name}</span>
        <div className="mt-auto flex flex-col gap-1">
          {rows.map((item, index) => (
            <span key={index} className="flex justify-between gap-2 border-b border-border pb-1 text-[10px]">
              <span className="truncate">{item.title}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{item.amount ? formatMoney(item.amount, template.currency ?? 'USD') : 'Included'}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Total</span>
          <span className="text-xs font-semibold tabular-nums">{total}</span>
        </div>
      </div>
    </div>
  )
}

export function TemplatesView({ templates }: { templates: TemplateCard[] }) {
  const [service, setService] = useState('all')
  const [style, setStyle] = useState<'all' | InvoiceStyle>('all')
  const [deleting, setDeleting] = useState<TemplateCard | null>(null)
  const [working, start] = useTransition()

  const services = [...new Set(templates.map((template) => template.serviceType).filter((value): value is string => Boolean(value)))].sort()
  const styles = STYLE_OPTIONS.filter((option) => templates.some((template) => template.style === option.value))
  const shown = templates.filter(
    (template) => (service === 'all' || template.serviceType === service) && (style === 'all' || template.style === style),
  )

  if (templates.length === 0) {
    return (
      <Empty className="border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconLayersTwo />
          </EmptyMedia>
          <EmptyTitle>No templates yet</EmptyTitle>
          <EmptyDescription>Save the line items, notes and style you use for a kind of work, then start invoices from them.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/templates/new">
              <IconPlusMedium />
              New template
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className={cn('flex flex-col gap-4 transition-opacity', working && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-2">
        {services.length > 0 && (
          // Scrolls sideways on narrow screens instead of widening the page.
          <div className="max-w-full overflow-x-auto">
            <ToggleGroup type="single" variant="outline" size="sm" value={service} onValueChange={(next) => setService(next || 'all')} aria-label="Service type">
              <ToggleGroupItem value="all">All services</ToggleGroupItem>
              {services.map((entry) => (
                <ToggleGroupItem key={entry} value={entry}>
                  {entry}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
        {styles.length > 1 && (
          <Select value={style} onValueChange={(next) => setStyle(next as typeof style)}>
            <SelectTrigger size="sm" className="w-44" aria-label="Style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All styles</SelectItem>
              {styles.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No templates match these filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((template) => (
            <Card key={template.id} className="gap-0 overflow-hidden pt-0">
              <Link href={`/templates/${template.id}`} className="outline-none focus-visible:shadow-focus" aria-label={`Edit ${template.name}`}>
                <TemplatePreview template={template} className="h-52" />
              </Link>
              <CardHeader className="pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {template.serviceType && <Badge variant="secondary">{template.serviceType}</Badge>}
                  <Badge variant="outline">{STYLE_OPTIONS.find((option) => option.value === template.style)?.label}</Badge>
                </div>
                <CardTitle className="truncate">{template.name}</CardTitle>
                {template.description && <CardDescription className="line-clamp-2">{template.description}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-3 text-xs text-muted-foreground">
                {template.items.length} {template.items.length === 1 ? 'item' : 'items'} · {formatMoney(sumItems(template.items), template.currency ?? 'USD')}
                {template.invoiceCount > 0 && ` · used in ${template.invoiceCount} ${template.invoiceCount === 1 ? 'invoice' : 'invoices'}`}
              </CardContent>
              <CardFooter className="mt-auto gap-2 pt-4">
                <Button asChild size="sm">
                  <Link href={`/invoices/new?template=${template.id}`}>Use template</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/templates/${template.id}`}>
                    <IconPencil />
                    Edit
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" className="ml-auto" aria-label={`More actions for ${template.name}`}>
                      <IconDotGrid1x3Horizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() =>
                        start(async () => {
                          await duplicateTemplateAction(template.id)
                          toast.success('Template duplicated')
                        })
                      }
                    >
                      <IconSquareBehindSquare1 />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(template)}>
                      <IconTrashCan />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Invoices made from it stay as they are.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleting &&
                start(async () => {
                  await deleteTemplateAction(deleting.id)
                  toast.success('Template deleted')
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
