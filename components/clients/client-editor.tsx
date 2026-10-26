'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconCheckmark1Medium, IconCrossMedium, IconFolder1, IconPencil, IconPlusMedium, IconTrashCan } from 'central-icons'

import { addProjectAction, deleteClientAction, deleteProjectAction, renameProjectAction, updateClientAction } from '@/app/(app)/clients/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Client } from '@/lib/types'

export function ClientEditor({ client, hasInvoices }: { client: Client; hasInvoices: boolean }) {
  const [state, action, pending] = useActionState(updateClientAction, { error: null })
  const [values, setValues] = useState({
    name: client.name,
    company: client.company ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    address: client.address ?? '',
    website: client.website ?? '',
    notes: client.notes ?? '',
  })
  const [deleting, startDelete] = useTransition()

  useEffect(() => {
    if (state.done) toast.success('Client saved')
  }, [state.done])

  const field = (key: keyof typeof values) => ({
    name: key,
    value: values[key],
    onChange: (event: { target: { value: string } }) => setValues((current) => ({ ...current, [key]: event.target.value })),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
        <CardDescription>Shown on invoices under “Bill to”.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={client.id} />
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="client-name">Contact name</FieldLabel>
              <Input id="client-name" required {...field('name')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-company">Company</FieldLabel>
              <Input id="client-company" {...field('company')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-email">Email</FieldLabel>
              <Input id="client-email" type="email" {...field('email')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-phone">Phone</FieldLabel>
              <Input id="client-phone" type="tel" {...field('phone')} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="client-website">Website</FieldLabel>
              <Input id="client-website" type="url" placeholder="https://" {...field('website')} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="client-address">Billing address</FieldLabel>
              <Textarea id="client-address" rows={2} {...field('address')} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="client-notes">Private notes</FieldLabel>
              <Textarea id="client-notes" rows={3} placeholder="Only you see these." {...field('notes')} />
            </Field>
          </FieldGroup>
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="text-destructive" disabled={hasInvoices} title={hasInvoices ? 'Delete the client’s invoices first' : undefined}>
                  <IconTrashCan />
                  Delete client
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this client?</AlertDialogTitle>
                  <AlertDialogDescription>Their projects are deleted too. This can’t be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleting}
                    onClick={(event) => {
                      event.preventDefault()
                      startDelete(async () => {
                        const result = await deleteClientAction(client.id)
                        if (result?.error) toast.error(result.error)
                      })
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" loading={pending}>
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function ProjectsCard({ clientId, projects }: { clientId: string; projects: { id: string; name: string }[] }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [working, start] = useTransition()

  const add = () =>
    start(async () => {
      const result = await addProjectAction(clientId, name)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setName('')
      setAdding(false)
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>Group this client’s invoices by project or task.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <IconPlusMedium />
            Add
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {projects.length === 0 && !adding && <p className="text-sm text-muted-foreground">No projects yet.</p>}
        {projects.map((project) =>
          editing === project.id ? (
            <form
              key={project.id}
              className="flex items-center gap-1"
              onSubmit={(event) => {
                event.preventDefault()
                start(async () => {
                  const result = await renameProjectAction(project.id, editName)
                  if (result.error) {
        toast.error(result.error)
        return
      }
                  setEditing(null)
                })
              }}
            >
              <Input value={editName} onChange={(event) => setEditName(event.target.value)} aria-label="Project name" autoFocus />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Save" disabled={working}>
                <IconCheckmark1Medium />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setEditing(null)}>
                <IconCrossMedium />
              </Button>
            </form>
          ) : (
            <div key={project.id} className="group flex h-8 items-center gap-2 rounded-md px-1 hover:bg-accent">
              <IconFolder1 className="size-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Rename ${project.name}`}
                onClick={() => {
                  setEditing(project.id)
                  setEditName(project.name)
                }}
              >
                <IconPencil />
              </Button>
              <Button variant="ghost" size="icon-xs" aria-label={`Delete ${project.name}`} disabled={working} onClick={() => start(() => deleteProjectAction(project.id))}>
                <IconTrashCan />
              </Button>
            </div>
          ),
        )}
        {adding && (
          <form
            className="flex items-center gap-1"
            onSubmit={(event) => {
              event.preventDefault()
              add()
            }}
          >
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" aria-label="New project name" autoFocus />
            <Button type="submit" size="sm" disabled={working || !name.trim()}>
              Add
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setAdding(false)}>
              <IconCrossMedium />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
