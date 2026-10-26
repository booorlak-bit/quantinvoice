'use client'

import type { Dispatch, SetStateAction } from 'react'
import { IconCrossMedium, IconPlusMedium } from 'central-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { formatMoney, sumItems } from '@/lib/format'
import type { Note } from '@/lib/types'

/** List rows carry a stable key so React keeps focus while rows are added and removed. */
export type Row<T> = T & { key: number }
let nextKey = 0
export const withKey = <T,>(value: T): Row<T> => ({ ...value, key: nextKey++ })

export type ItemRow = Row<{ title: string; description: string; amount: string }>
export const emptyItem = (): ItemRow => withKey({ title: '', description: '', amount: '' })

/** The total of the rows as typed: amounts that aren't numbers yet count as included. */
export function itemsTotal(items: ItemRow[]) {
  return sumItems(
    items.map((item) => {
      const cleaned = item.amount.replace(/[\s,$€£₽]/g, '')
      return { amount: /^\d+(\.\d{1,2})?$/.test(cleaned) ? cleaned : null }
    }),
  )
}

/** Line items as form fields (itemTitle, itemDescription, itemAmount), with the running total. */
export function LineItemsEditor({ items, onChange, currency }: { items: ItemRow[]; onChange: Dispatch<SetStateAction<ItemRow[]>>; currency: string }) {
  const update = (key: number, patch: Partial<ItemRow>) => onChange((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={item.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_8rem_auto]">
            <Input name="itemTitle" placeholder="Item" aria-label={`Item ${index + 1}`} value={item.title} onChange={(event) => update(item.key, { title: event.target.value })} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="sm:order-last"
              aria-label={`Remove item ${index + 1}`}
              disabled={items.length === 1}
              onClick={() => onChange((rows) => rows.filter((row) => row.key !== item.key))}
            >
              <IconCrossMedium />
            </Button>
            <Input
              name="itemDescription"
              placeholder="Description"
              aria-label={`Item ${index + 1} description`}
              className="col-span-2 sm:col-span-1"
              value={item.description}
              onChange={(event) => update(item.key, { description: event.target.value })}
            />
            <Input
              name="itemAmount"
              placeholder="Included"
              inputMode="decimal"
              aria-label={`Item ${index + 1} amount`}
              className="col-span-2 text-right tabular-nums sm:col-span-1"
              value={item.amount}
              onChange={(event) => update(item.key, { amount: event.target.value })}
            />
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange((rows) => [...rows, emptyItem()])}>
        <IconPlusMedium />
        Add item
      </Button>
      <Separator />
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-muted-foreground">Total</span>
        <span className="text-base text-foreground tabular-nums">{formatMoney(itemsTotal(items), currency)}</span>
      </div>
    </div>
  )
}

/** Titled notes as form fields (noteTitle, noteBody). */
export function NotesEditor({ notes, onChange }: { notes: Row<Note>[]; onChange: Dispatch<SetStateAction<Row<Note>[]>> }) {
  const update = (key: number, patch: Partial<Note>) => onChange((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  return (
    <div className="flex flex-col gap-3">
      {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes.</p>}
      {notes.map((note, index) => (
        <div key={note.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="flex min-w-0 flex-col gap-2">
            <Input name="noteTitle" placeholder="Title" aria-label={`Note ${index + 1} title`} value={note.title} onChange={(event) => update(note.key, { title: event.target.value })} />
            <Textarea
              name="noteBody"
              placeholder="Text"
              rows={2}
              aria-label={`Note ${index + 1} text`}
              value={note.body}
              onChange={(event) => update(note.key, { body: event.target.value })}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove note ${index + 1}`} onClick={() => onChange((rows) => rows.filter((row) => row.key !== note.key))}>
            <IconCrossMedium />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange((rows) => [...rows, withKey({ title: '', body: '' })])}>
        <IconPlusMedium />
        Add note
      </Button>
    </div>
  )
}
