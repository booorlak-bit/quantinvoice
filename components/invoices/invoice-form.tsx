'use client'

import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import {
  IconCheckmark1Medium,
  IconCrossMedium,
  IconFolder1,
  IconPeopleAdd,
  IconPlusMedium,
} from 'central-icons'

import { saveInvoiceAction } from '@/app/(app)/invoices/actions'
import { NewClientDialog, type PickerClient } from '@/components/clients/new-client-dialog'
import { METHOD_KINDS, methodSummary } from '@/components/payment-methods/kinds'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox'
import { DatePicker, DatePickerContent, DatePickerTrigger } from '@/components/ui/date-picker'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { addDaysIso, formatMoney, sumItems } from '@/lib/format'
import type { InvoiceItem, InvoiceStatus, InvoiceStyle, Note, PaymentMethod } from '@/lib/types'
import { submitWithoutReset } from '@/lib/submit'
import { cn } from '@/lib/utils'

export const STYLE_OPTIONS: { value: InvoiceStyle; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'OSDS, white surfaces and blue actions' },
  { value: 'dark', label: 'Dark', description: 'OSDS in dark mode' },
  { value: 'alt-light', label: 'Monochrome', description: 'Black actions, glass cards' },
  { value: 'alt-dark', label: 'Monochrome dark', description: 'Monochrome in dark mode' },
  { value: 'quantum', label: 'Quantum', description: 'The original Framer template' },
]

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'not_paid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
]

export type FormTemplate = {
  id: string
  name: string
  serviceType: string | null
  style: InvoiceStyle
  currency: string | null
  items: InvoiceItem[]
  notes: Note[]
}

export type InvoiceFormValues = {
  id?: string
  companyId: string
  clientId: string | null
  projectName: string
  templateId: string | null
  number: string
  slug: string
  title: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  currency: string
  taxNote: string
  style: InvoiceStyle
  stripeLink: string
  methodIds: string[]
  notes: Note[]
  items: { title: string; description: string; amount: string }[]
}

type Row<T> = T & { key: number }
let nextKey = 0
const withKey = <T,>(value: T): Row<T> => ({ ...value, key: nextKey++ })
const emptyItem = () => withKey({ title: '', description: '', amount: '' })

export function InvoiceForm({
  initial,
  companies,
  clients: initialClients,
  templates,
  methods,
  numberByCompany,
}: {
  initial: InvoiceFormValues
  methods: PaymentMethod[]
  companies: { id: string; name: string; defaultCurrency: string }[]
  clients: PickerClient[]
  templates: FormTemplate[]
  /** Suggested next number per company, for new invoices. */
  numberByCompany: Record<string, string>
}) {
  const isNew = !initial.id
  const [state, action, pending] = useActionState(saveInvoiceAction, { error: null })
  const [values, setValues] = useState(initial)
  const [clients, setClients] = useState(initialClients)
  const [items, setItems] = useState(() => (initial.items.length ? initial.items.map(withKey) : [emptyItem()]))
  const [notes, setNotes] = useState(() => initial.notes.map(withKey))
  const [numberTouched, setNumberTouched] = useState(!isNew)

  const set = <K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  const client = clients.find((entry) => entry.id === values.clientId) ?? null
  const total = sumItems(
    items.map((item) => {
      const cleaned = item.amount.replace(/[\s,$€£₽]/g, '')
      return { amount: /^\d+(\.\d{1,2})?$/.test(cleaned) ? cleaned : null }
    }),
  )
  const currencyValid = /^[A-Z]{3}$/.test(values.currency)

  const applyTemplate = (templateId: string) => {
    const template = templates.find((entry) => entry.id === templateId)
    if (!template) return
    setValues((current) => ({
      ...current,
      templateId,
      style: template.style,
      currency: template.currency ?? current.currency,
      title: current.title || template.name,
    }))
    setItems(template.items.length ? template.items.map((item) => withKey({ title: item.title, description: item.description ?? '', amount: item.amount ?? '' })) : [emptyItem()])
    setNotes(template.notes.map(withKey))
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="clientId" value={values.clientId ?? ''} />
      <input type="hidden" name="companyId" value={values.companyId} />
      <input type="hidden" name="templateId" value={values.templateId ?? ''} />
      <input type="hidden" name="projectName" value={values.projectName} />
      <input type="hidden" name="issueDate" value={values.issueDate} />
      <input type="hidden" name="dueDate" value={values.dueDate} />
      <input type="hidden" name="status" value={values.status} />
      <input type="hidden" name="style" value={values.style} />

      <div className="flex min-w-0 flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Bill to</CardTitle>
            <CardDescription>Pick a client or add a new one. Projects group invoices for the same client.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Client</FieldLabel>
                <ClientPicker
                  clients={clients}
                  value={values.clientId}
                  onChange={(clientId) => setValues((current) => ({ ...current, clientId, projectName: '' }))}
                  onCreated={(created) => {
                    setClients((current) => [...current, created])
                    setValues((current) => ({ ...current, clientId: created.id, projectName: '' }))
                  }}
                />
                {client?.email && <FieldDescription>{client.email}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel>Project or task</FieldLabel>
                <ProjectPicker
                  projects={client?.projects ?? []}
                  disabled={!client}
                  value={values.projectName}
                  onChange={(projectName) => set('projectName', projectName)}
                />
                <FieldDescription>Optional. Type a new name to create it.</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input id="title" name="title" required placeholder="Website redesign" value={values.title} onChange={(event) => set('title', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="number">Invoice number</FieldLabel>
                <Input
                  id="number"
                  name="number"
                  required
                  className="font-mono"
                  value={values.number}
                  onChange={(event) => {
                    setNumberTouched(true)
                    set('number', event.target.value)
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
                <Input
                  id="currency"
                  name="currency"
                  required
                  maxLength={3}
                  className="uppercase"
                  value={values.currency}
                  onChange={(event) => set('currency', event.target.value.toUpperCase())}
                />
              </Field>
              <Field>
                <FieldLabel>Issue date</FieldLabel>
                <DateField value={values.issueDate} onChange={(issueDate) => set('issueDate', issueDate)} />
              </Field>
              <Field>
                <FieldLabel>Due date</FieldLabel>
                <DateField value={values.dueDate} onChange={(dueDate) => set('dueDate', dueDate)} placeholder="No due date" />
                <div className="flex flex-wrap gap-1">
                  {[7, 14, 30].map((days) => (
                    <Button key={days} type="button" variant="ghost" size="sm" onClick={() => set('dueDate', addDaysIso(values.issueDate, days))}>
                      Net {days}
                    </Button>
                  ))}
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Leave the amount empty to show an item as included.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {items.map((item, index) => (
                <li key={item.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_8rem_auto]">
                  <Input
                    name="itemTitle"
                    placeholder="Item"
                    aria-label={`Item ${index + 1}`}
                    value={item.title}
                    onChange={(event) => setItems((rows) => rows.map((row) => (row.key === item.key ? { ...row, title: event.target.value } : row)))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="sm:order-last"
                    aria-label={`Remove item ${index + 1}`}
                    disabled={items.length === 1}
                    onClick={() => setItems((rows) => rows.filter((row) => row.key !== item.key))}
                  >
                    <IconCrossMedium />
                  </Button>
                  <Input
                    name="itemDescription"
                    placeholder="Description"
                    aria-label={`Item ${index + 1} description`}
                    className="col-span-2 sm:col-span-1"
                    value={item.description}
                    onChange={(event) => setItems((rows) => rows.map((row) => (row.key === item.key ? { ...row, description: event.target.value } : row)))}
                  />
                  <Input
                    name="itemAmount"
                    placeholder="Included"
                    inputMode="decimal"
                    aria-label={`Item ${index + 1} amount`}
                    className="col-span-2 text-right tabular-nums sm:col-span-1"
                    value={item.amount}
                    onChange={(event) => setItems((rows) => rows.map((row) => (row.key === item.key ? { ...row, amount: event.target.value } : row)))}
                  />
                </li>
              ))}
            </ul>
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setItems((rows) => [...rows, emptyItem()])}>
              <IconPlusMedium />
              Add item
            </Button>
            <Separator />
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-muted-foreground">Total</span>
              <span className="text-base text-foreground tabular-nums">{formatMoney(total, currencyValid ? values.currency : 'USD')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Terms, expenses and payment instructions shown under the totals.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes.</p>}
            {notes.map((note, index) => (
              <div key={note.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <div className="flex min-w-0 flex-col gap-2">
                  <Input
                    name="noteTitle"
                    placeholder="Title"
                    aria-label={`Note ${index + 1} title`}
                    value={note.title}
                    onChange={(event) => setNotes((rows) => rows.map((row) => (row.key === note.key ? { ...row, title: event.target.value } : row)))}
                  />
                  <Textarea
                    name="noteBody"
                    placeholder="Text"
                    rows={2}
                    aria-label={`Note ${index + 1} text`}
                    value={note.body}
                    onChange={(event) => setNotes((rows) => rows.map((row) => (row.key === note.key ? { ...row, body: event.target.value } : row)))}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove note ${index + 1}`} onClick={() => setNotes((rows) => rows.filter((row) => row.key !== note.key))}>
                  <IconCrossMedium />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setNotes((rows) => [...rows, withKey({ title: '', body: '' })])}>
              <IconPlusMedium />
              Add note
            </Button>
          </CardContent>
        </Card>
      </div>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-4">
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {isNew && templates.length > 0 && (
                <Field>
                  <FieldLabel>Start from template</FieldLabel>
                  <Select value={values.templateId ?? ''} onValueChange={applyTemplate}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Blank invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                          {template.serviceType && <span className="text-muted-foreground"> · {template.serviceType}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              {companies.length > 1 && (
                <Field>
                  <FieldLabel>From</FieldLabel>
                  <Select
                    value={values.companyId}
                    onValueChange={(companyId) => {
                      const company = companies.find((entry) => entry.id === companyId)
                      setValues((current) => ({
                        ...current,
                        companyId,
                        number: !numberTouched && numberByCompany[companyId] ? numberByCompany[companyId] : current.number,
                        currency: isNew && company ? company.defaultCurrency : current.currency,
                      }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={values.status} onValueChange={(status) => set('status', status as InvoiceStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Drafts are hidden from clients.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Style</FieldLabel>
                <StylePicker value={values.style} onChange={(style) => set('style', style)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="taxNote">Tax line</FieldLabel>
                <Input id="taxNote" name="taxNote" value={values.taxNote} onChange={(event) => set('taxNote', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="slug">Page address</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>/i/</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput id="slug" name="slug" placeholder="From the title" value={values.slug} onChange={(event) => set('slug', event.target.value)} />
                </InputGroup>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <PaymentMethodsCard
          methods={methods}
          selected={values.methodIds}
          onSelectedChange={(methodIds) => set('methodIds', methodIds)}
          stripeLink={values.stripeLink}
          onStripeLinkChange={(stripeLink) => set('stripeLink', stripeLink)}
        />

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" loading={pending}>
            {isNew ? 'Create invoice' : 'Save changes'}
          </Button>
          <Button asChild variant="outline">
            <Link href={values.id ? `/invoices/${values.id}` : '/invoices'}>Cancel</Link>
          </Button>
        </div>
      </aside>
    </form>
  )
}

/** Which payment methods the invoice offers, plus an optional Stripe link just for this invoice. */
function PaymentMethodsCard({
  methods,
  selected,
  onSelectedChange,
  stripeLink,
  onStripeLinkChange,
}: {
  methods: PaymentMethod[]
  selected: string[]
  onSelectedChange: (ids: string[]) => void
  stripeLink: string
  onStripeLinkChange: (value: string) => void
}) {
  const stripe = methods.find((method) => method.type === 'stripe' && selected.includes(method.id))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>{methods.length ? 'Ways to pay shown on the invoice.' : 'Add payment methods to show pay buttons on the invoice.'}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {selected.map((id) => (
          <input key={id} type="hidden" name="methodId" value={id} />
        ))}
        {methods.length === 0 ? (
          <Button asChild variant="outline" size="sm" className="self-start">
            <a href="/payment-methods" target="_blank" rel="noopener noreferrer">
              Add payment methods
            </a>
          </Button>
        ) : (
          <div className="flex flex-col gap-2.5">
            {methods.map((method) => {
              const Icon = METHOD_KINDS[method.type].icon
              const checked = selected.includes(method.id)
              return (
                <label key={method.id} className="flex items-start gap-2.5">
                  <Checkbox
                    className="mt-0.5"
                    checked={checked}
                    onCheckedChange={(next) => onSelectedChange(next ? [...selected, method.id] : selected.filter((id) => id !== method.id))}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{method.name}</span>
                    </span>
                    <span className="truncate font-mono text-xs text-muted-foreground">{methodSummary(method)}</span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
        {(stripe || stripeLink) && (
          <Field>
            <FieldLabel htmlFor="stripeLink">Stripe link for this invoice</FieldLabel>
            <Input
              id="stripeLink"
              name="stripeLink"
              type="url"
              placeholder={stripe?.type === 'stripe' ? stripe.details.url : 'https://buy.stripe.com/…'}
              value={stripeLink}
              onChange={(event) => onStripeLinkChange(event.target.value)}
            />
            <FieldDescription>{stripe ? `Leave empty to use the ${stripe.name} link.` : 'Shown as a card payment button.'}</FieldDescription>
          </Field>
        )}
      </CardContent>
    </Card>
  )
}

function ClientPicker({
  clients,
  value,
  onChange,
  onCreated,
}: {
  clients: PickerClient[]
  value: string | null
  onChange: (id: string) => void
  onCreated: (client: PickerClient) => void
}) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const current = clients.find((client) => client.id === value)

  return (
    <>
      <ComboboxRoot open={open} onOpenChange={setOpen}>
        <ComboboxTrigger aria-label="Client">
          <ComboboxValue placeholder="Choose a client">{current ? (current.company ?? current.name) : null}</ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent className="w-(--radix-popover-trigger-width) min-w-64">
          <ComboboxInput placeholder="Search clients…" value={search} onValueChange={setSearch} />
          <ComboboxList>
            <ComboboxEmpty>No clients found.</ComboboxEmpty>
            <ComboboxGroup>
              {clients.map((client) => (
                <ComboboxItem
                  key={client.id}
                  value={`${client.company ?? ''} ${client.name} ${client.email ?? ''} ${client.id}`}
                  checked={client.id === value}
                  onSelect={() => {
                    onChange(client.id)
                    setOpen(false)
                  }}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{client.company ?? client.name}</span>
                    {client.company && <span className="truncate text-xs text-muted-foreground">{client.name}</span>}
                  </span>
                </ComboboxItem>
              ))}
            </ComboboxGroup>
            <ComboboxSeparator />
            <ComboboxGroup>
              <ComboboxItem
                value={`new client ${search}`}
                onSelect={() => {
                  setOpen(false)
                  setDialogOpen(true)
                }}
              >
                <IconPeopleAdd />
                New client{search ? ` “${search}”` : ''}
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </ComboboxRoot>
      <NewClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultName={search}
        onCreated={(client) => {
          onCreated(client)
          setSearch('')
        }}
      />
    </>
  )
}

function ProjectPicker({
  projects,
  value,
  disabled,
  onChange,
}: {
  projects: { id: string; name: string }[]
  value: string
  disabled: boolean
  onChange: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const typed = search.trim()
  const exists = projects.some((project) => project.name.toLowerCase() === typed.toLowerCase())

  return (
    <ComboboxRoot open={open} onOpenChange={setOpen}>
      <ComboboxTrigger aria-label="Project" disabled={disabled}>
        <IconFolder1 />
        <ComboboxValue placeholder={disabled ? 'Choose a client first' : 'No project'}>{value || null}</ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent className="w-(--radix-popover-trigger-width) min-w-64">
        <ComboboxInput placeholder="Find or create a project…" value={search} onValueChange={setSearch} />
        <ComboboxList>
          <ComboboxEmpty>{typed ? 'Press Enter to create it.' : 'No projects yet.'}</ComboboxEmpty>
          <ComboboxGroup>
            {value && (
              <ComboboxItem
                value="__none__"
                onSelect={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                <IconCrossMedium />
                No project
              </ComboboxItem>
            )}
            {projects.map((project) => (
              <ComboboxItem
                key={project.id}
                value={project.name}
                checked={project.name === value}
                onSelect={() => {
                  onChange(project.name)
                  setOpen(false)
                }}
              >
                {project.name}
              </ComboboxItem>
            ))}
            {typed && !exists && (
              <ComboboxItem
                value={typed}
                onSelect={() => {
                  onChange(typed)
                  setSearch('')
                  setOpen(false)
                }}
              >
                <IconPlusMedium />
                Create “{typed}”
              </ComboboxItem>
            )}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  )
}

function DateField({ value, onChange, placeholder = 'Pick a date' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined
  return (
    <DatePicker open={open} onOpenChange={setOpen}>
      <DatePickerTrigger className="w-full">{selected ? format(selected, 'MMM d, yyyy') : <span className="text-muted-foreground">{placeholder}</span>}</DatePickerTrigger>
      <DatePickerContent>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : '')
            setOpen(false)
          }}
        />
      </DatePickerContent>
    </DatePicker>
  )
}

export function StylePicker({ value, onChange }: { value: InvoiceStyle; onChange: (value: InvoiceStyle) => void }) {
  return (
    <div role="radiogroup" aria-label="Invoice style" className="grid grid-cols-5 gap-1.5">
      {STYLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          title={`${option.label}: ${option.description}`}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative flex aspect-square items-end justify-start overflow-hidden rounded-md border border-border p-1 outline-none focus-visible:shadow-focus',
            value === option.value && 'border-primary ring-1 ring-primary',
          )}
        >
          <StyleSwatch style={option.value} />
          {value === option.value && <IconCheckmark1Medium className="absolute top-1 right-1 size-3.5 text-primary" />}
          <span className="sr-only">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

/** A tiny invoice drawn in the style's own theme. */
export function StyleSwatch({ style }: { style: InvoiceStyle }) {
  if (style === 'quantum') {
    return (
      <span aria-hidden="true" className="absolute inset-0 flex flex-col gap-0.5 bg-muted p-1.5">
        <span className="size-2 rounded-[2px] bg-foreground" />
        <span className="mt-auto h-0.5 w-3/4 rounded-full bg-foreground/60" />
        <span className="h-0.5 w-1/2 rounded-full bg-foreground/30" />
      </span>
    )
  }
  const dark = style === 'dark' || style === 'alt-dark'
  const alt = style === 'alt-light' || style === 'alt-dark'
  return (
    <span aria-hidden="true" data-theme={alt ? 'alt' : 'osds'} className={cn('absolute inset-0 flex flex-col gap-0.5 bg-background p-1.5', dark && 'dark')}>
      <span className="h-0.5 w-1/2 rounded-full bg-foreground/70" />
      <span className="h-0.5 w-1/3 rounded-full bg-muted-foreground/50" />
      <span className="mt-auto h-1.5 w-full rounded-[2px] bg-primary" />
    </span>
  )
}
