'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconPencil, IconPlusMedium, IconTrashCan, IconWallet1 } from 'central-icons'

import { deleteMethodAction, saveMethodAction } from '@/app/(app)/payment-methods/actions'
import { METHOD_KINDS, methodSummary } from '@/components/payment-methods/kinds'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitWithoutReset } from '@/lib/submit'
import { PAYMENT_METHOD_TYPES, type PaymentMethod, type PaymentMethodType } from '@/lib/types'

type Editing = { type: PaymentMethodType; method: PaymentMethod | null } | null

export function MethodsView({ methods }: { methods: PaymentMethod[] }) {
  const [editing, setEditing] = useState<Editing>(null)
  const [working, start] = useTransition()
  const add = (type: PaymentMethodType) => setEditing({ type, method: null })

  return (
    <div className="flex flex-col gap-4">
      {methods.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconWallet1 />
            </EmptyMedia>
            <EmptyTitle>No payment methods yet</EmptyTitle>
            <EmptyDescription>Add the ways clients can pay you. Each one gets its own name and shows up on your invoices.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
            {PAYMENT_METHOD_TYPES.map((type) => {
              const kind = METHOD_KINDS[type]
              return (
                <Button key={type} variant="outline" className="h-auto justify-start py-2.5 text-left" onClick={() => add(type)}>
                  <kind.icon />
                  <span className="flex min-w-0 flex-col">
                    <span>{kind.label}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">{kind.description}</span>
                  </span>
                </Button>
              )
            })}
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex justify-end">
            <AddMethodMenu onSelect={add} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {methods.map((method) => {
              const kind = METHOD_KINDS[method.type]
              return (
                <Card key={method.id}>
                  <CardHeader>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-5">
                        <kind.icon />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <CardTitle className="truncate">{method.name}</CardTitle>
                        <CardDescription className="truncate">{kind.label}</CardDescription>
                      </div>
                    </div>
                    <CardAction>{method.isDefault && <Badge color="blue">On new invoices</Badge>}</CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="truncate font-mono text-xs text-muted-foreground">{methodSummary(method)}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing({ type: method.type, method })}>
                        <IconPencil />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={working}>
                            <IconTrashCan />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {method.name}?</AlertDialogTitle>
                            <AlertDialogDescription>It disappears from every invoice that offers it. Recorded payments stay.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() =>
                                start(async () => {
                                  await deleteMethodAction(method.id)
                                  toast.success('Payment method deleted')
                                })
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
      <MethodDialog key={editing ? `${editing.type}-${editing.method?.id ?? 'new'}` : 'closed'} editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function AddMethodMenu({ onSelect }: { onSelect: (type: PaymentMethodType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <IconPlusMedium />
          Add method
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {PAYMENT_METHOD_TYPES.map((type) => {
          const kind = METHOD_KINDS[type]
          return (
            <DropdownMenuItem key={type} onSelect={() => onSelect(type)} className="items-start">
              <kind.icon className="mt-0.5" />
              <span className="flex flex-col">
                <span>{kind.label}</span>
                <span className="text-xs text-muted-foreground">{kind.description}</span>
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const DEFAULT_NAMES: Record<PaymentMethodType, string> = {
  stripe: 'Card (Stripe)',
  crypto: 'USDT',
  bank: 'Bank transfer',
  link: 'PayPal',
}

function MethodDialog({ editing, onClose }: { editing: Editing; onClose: () => void }) {
  const [state, action, pending] = useActionState(saveMethodAction, { error: null })
  const method = editing?.method ?? null

  useEffect(() => {
    if (!state.done) return
    toast.success(method ? 'Payment method saved' : 'Payment method added')
    onClose()
    // Only react to a newly completed save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done])

  if (!editing) return <Dialog open={false} />
  const kind = METHOD_KINDS[editing.type]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4">
          <input type="hidden" name="type" value={editing.type} />
          {method && <input type="hidden" name="id" value={method.id} />}
          <DialogHeader>
            <DialogTitle>{method ? `Edit ${method.name}` : `Add ${kind.label.toLowerCase()}`}</DialogTitle>
            <DialogDescription>{kind.description}. Clients see the name on the invoice.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="method-name">Name</FieldLabel>
              <Input id="method-name" name="name" required maxLength={60} defaultValue={method?.name ?? DEFAULT_NAMES[editing.type]} />
            </Field>
            <KindFields method={method} type={editing.type} />
          </FieldGroup>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox name="isDefault" defaultChecked={method?.isDefault ?? true} />
            Offer on new invoices by default
          </label>
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
              {method ? 'Save' : 'Add method'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function KindFields({ type, method }: { type: PaymentMethodType; method: PaymentMethod | null }) {
  switch (type) {
    case 'stripe': {
      const details = method?.type === 'stripe' ? method.details : null
      return (
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="method-url">Payment link</FieldLabel>
          <Input id="method-url" name="url" type="url" required placeholder="https://buy.stripe.com/…" defaultValue={details?.url} />
          <FieldDescription>
            Create one in Stripe under Payment Links. You can paste a different link on any invoice. Connecting the Stripe API comes later.
          </FieldDescription>
        </Field>
      )
    }
    case 'crypto': {
      const details = method?.type === 'crypto' ? method.details : null
      return (
        <>
          <Field>
            <FieldLabel htmlFor="method-asset">Coin</FieldLabel>
            <Input id="method-asset" name="asset" required maxLength={12} className="uppercase" placeholder="USDT" defaultValue={details?.asset} />
          </Field>
          <Field>
            <FieldLabel htmlFor="method-network">Network</FieldLabel>
            <Input id="method-network" name="network" required maxLength={40} placeholder="TRON (TRC-20)" defaultValue={details?.network} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="method-address">Wallet address</FieldLabel>
            <Input id="method-address" name="address" required className="font-mono" autoComplete="off" spellCheck={false} defaultValue={details?.address} />
            <FieldDescription>Clients get a QR code for it. Double-check the network: coins sent on the wrong one are lost.</FieldDescription>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="method-memo">Memo or tag</FieldLabel>
            <Input id="method-memo" name="memo" maxLength={100} placeholder="Only if your wallet needs one" defaultValue={details?.memo ?? ''} />
          </Field>
        </>
      )
    }
    case 'bank': {
      const details = method?.type === 'bank' ? method.details : null
      return (
        <>
          <Field>
            <FieldLabel htmlFor="method-holder">Account holder</FieldLabel>
            <Input id="method-holder" name="accountHolder" required defaultValue={details?.accountHolder} />
          </Field>
          <Field>
            <FieldLabel htmlFor="method-bank">Bank</FieldLabel>
            <Input id="method-bank" name="bankName" defaultValue={details?.bankName ?? ''} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="method-iban">IBAN</FieldLabel>
            <Input id="method-iban" name="iban" className="font-mono uppercase" autoComplete="off" defaultValue={details?.iban ?? ''} />
          </Field>
          <Field>
            <FieldLabel htmlFor="method-account">Account number</FieldLabel>
            <Input id="method-account" name="accountNumber" className="font-mono" autoComplete="off" placeholder="If there’s no IBAN" defaultValue={details?.accountNumber ?? ''} />
          </Field>
          <Field>
            <FieldLabel htmlFor="method-swift">SWIFT / BIC</FieldLabel>
            <Input id="method-swift" name="swift" className="font-mono uppercase" defaultValue={details?.swift ?? ''} />
          </Field>
          <Field>
            <FieldLabel htmlFor="method-routing">Routing or sort code</FieldLabel>
            <Input id="method-routing" name="routingNumber" className="font-mono" defaultValue={details?.routingNumber ?? ''} />
          </Field>
          <Field>
            <FieldLabel htmlFor="method-reference">Payment reference</FieldLabel>
            <Input id="method-reference" name="reference" placeholder="Invoice number" defaultValue={details?.reference ?? ''} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="method-bank-address">Bank address</FieldLabel>
            <Textarea id="method-bank-address" name="bankAddress" rows={2} defaultValue={details?.bankAddress ?? ''} />
          </Field>
        </>
      )
    }
    case 'link': {
      const details = method?.type === 'link' ? method.details : null
      return (
        <>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="method-url">Link</FieldLabel>
            <Input id="method-url" name="url" type="url" required placeholder="https://paypal.me/…" defaultValue={details?.url} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="method-label">Button text</FieldLabel>
            <Input id="method-label" name="label" maxLength={40} placeholder="Pay now" defaultValue={details?.label ?? ''} />
          </Field>
        </>
      )
    }
  }
}
