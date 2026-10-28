'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import { saveTemplateAction } from '@/app/(app)/templates/actions'
import { emptyItem, LineItemsEditor, NotesEditor, withKey } from '@/components/invoices/editors'
import { STYLE_OPTIONS, StylePicker } from '@/components/invoices/style-picker'
import { TemplatePreview } from '@/components/templates/templates-view'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitWithoutReset } from '@/lib/submit'
import type { InvoiceItem, InvoiceStyle, Note } from '@/lib/types'

export type TemplateFormValues = {
  id?: string
  name: string
  serviceType: string
  description: string
  style: InvoiceStyle
  currency: string
  items: InvoiceItem[]
  notes: Note[]
}

export function TemplateForm({ initial, serviceTypes }: { initial: TemplateFormValues; serviceTypes: string[] }) {
  const [state, action, pending] = useActionState(saveTemplateAction, { error: null })
  const [values, setValues] = useState(initial)
  const [items, setItems] = useState(() =>
    initial.items.length ? initial.items.map((item) => withKey({ title: item.title, description: item.description ?? '', amount: item.amount ?? '' })) : [emptyItem()],
  )
  const [notes, setNotes] = useState(() => initial.notes.map(withKey))
  const set = <K extends keyof TemplateFormValues>(key: K, value: TemplateFormValues[K]) => setValues((current) => ({ ...current, [key]: value }))
  const currency = /^[A-Z]{3}$/.test(values.currency) ? values.currency : 'USD'
  const style = STYLE_OPTIONS.find((option) => option.value === values.style)

  return (
    <form onSubmit={submitWithoutReset(action)} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="style" value={values.style} />
      <div className="flex min-w-0 flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Template</CardTitle>
            <CardDescription>Group templates by the kind of work so the right one is easy to find.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" name="name" required maxLength={80} placeholder="Website design" value={values.name} onChange={(event) => set('name', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="serviceType">Service type</FieldLabel>
                <Input
                  id="serviceType"
                  name="serviceType"
                  list="service-types"
                  maxLength={60}
                  placeholder="Web design"
                  value={values.serviceType}
                  onChange={(event) => set('serviceType', event.target.value)}
                />
                <datalist id="service-types">
                  {serviceTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" name="description" rows={2} maxLength={300} value={values.description} onChange={(event) => set('description', event.target.value)} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Leave the amount empty to show an item as included. You can change everything on the invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineItemsEditor items={items} onChange={setItems} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Used instead of the brand’s default notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <NotesEditor notes={notes} onChange={setNotes} />
          </CardContent>
        </Card>
      </div>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-4">
        <Card className="gap-0 overflow-hidden pt-0">
          <TemplatePreview
            template={{
              name: values.name || 'Untitled template',
              style: values.style,
              currency,
              items: items.map((item) => ({ title: item.title || 'Item', description: null, amount: /^\d+(\.\d{1,2})?$/.test(item.amount) ? item.amount : null })),
            }}
            className="h-52"
          />
          <CardContent className="pt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Style</FieldLabel>
                <StylePicker value={values.style} onChange={(next) => set('style', next)} />
                <FieldDescription>{style?.description}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
                <Input
                  id="currency"
                  name="currency"
                  maxLength={3}
                  className="uppercase placeholder:normal-case"
                  placeholder="Brand default"
                  value={values.currency}
                  onChange={(event) => set('currency', event.target.value.toUpperCase())}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" loading={pending}>
            {values.id ? 'Save template' : 'Create template'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/templates">Cancel</Link>
          </Button>
        </div>
      </aside>
    </form>
  )
}
