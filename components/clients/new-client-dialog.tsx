'use client'

import { useActionState, useEffect } from 'react'

import { createClientAction, type ClientFormState } from '@/app/(app)/clients/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { submitWithoutReset } from '@/lib/submit'

export type PickerClient = {
  id: string
  name: string
  company: string | null
  email: string | null
  projects: { id: string; name: string }[]
}

export function NewClientDialog({
  open,
  onOpenChange,
  defaultName = '',
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultName?: string
  onCreated: (client: PickerClient) => void
}) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(createClientAction, { error: null })

  useEffect(() => {
    if (state.client) {
      onCreated(state.client)
      onOpenChange(false)
    }
    // Only react to a newly created client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.client])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          // The dialog sits inside the invoice form in the React tree; stop its submit from reaching that form.
          onSubmit={(event) => {
            event.stopPropagation()
            submitWithoutReset(action)(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>New client</DialogTitle>
            <DialogDescription>Add the person or company you bill. You can fill in the rest later.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="new-client-name">Contact name</FieldLabel>
              <Input id="new-client-name" name="name" required defaultValue={defaultName} placeholder="Alex Morgan" autoFocus />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-client-company">Company</FieldLabel>
              <Input id="new-client-company" name="company" placeholder="Coin Bank" />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-client-email">Email</FieldLabel>
              <Input id="new-client-email" name="email" type="email" placeholder="you@example.com" />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-client-phone">Phone</FieldLabel>
              <Input id="new-client-phone" name="phone" type="tel" placeholder="+1 555 0100" />
            </Field>
          </FieldGroup>
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={pending}>
              Add client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
