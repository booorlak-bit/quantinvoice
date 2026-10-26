'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  IconChainLink1,
  IconChevronDownMedium,
  IconCircleCheck,
  IconClock,
  IconDollar,
  IconFileText,
  IconPencil,
  IconSquareArrowTopRight,
  IconTrashCan,
} from 'central-icons'

import {
  deleteInvoiceAndReturn,
  deletePaymentAction,
  recordPaymentAction,
  setStatusAction,
} from '@/app/(app)/invoices/actions'
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
} from '@/components/ui/alert-dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import type { InvoiceStatus } from '@/lib/types'
import { submitWithoutReset } from '@/lib/submit'

export function CopyLinkButton({ slug, variant = 'outline', label = 'Copy link' }: { slug: string; variant?: 'outline' | 'default' | 'secondary'; label?: string }) {
  return (
    <Button
      variant={variant}
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/i/${slug}`)
        toast.success('Link copied')
      }}
    >
      <IconChainLink1 />
      {label}
    </Button>
  )
}

/** Header actions of the invoice page: edit, open the client page, change status, record a payment, delete. */
export function InvoiceActions({
  invoice,
}: {
  invoice: { id: string; slug: string; number: string; status: InvoiceStatus; currency: string; balance: string }
}) {
  const [working, start] = useTransition()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const setStatus = (status: InvoiceStatus) =>
    start(async () => {
      await setStatusAction([invoice.id], status)
      toast.success(status === 'paid' ? 'Marked as paid' : status === 'draft' ? 'Moved to drafts' : 'Marked as unpaid')
    })

  return (
    <>
      <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
        <a href={`/i/${invoice.slug}`} target="_blank" rel="noopener noreferrer">
          <IconSquareArrowTopRight />
          Client page
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={`/invoices/${invoice.id}/edit`}>
          <IconPencil />
          Edit
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" disabled={working}>
            Actions
            <IconChevronDownMedium />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={async () => {
              await navigator.clipboard.writeText(`${window.location.origin}/i/${invoice.slug}`)
              toast.success('Link copied')
            }}
          >
            <IconChainLink1 />
            Copy client link
          </DropdownMenuItem>
          {invoice.status !== 'paid' && (
            <DropdownMenuItem onSelect={() => setPaymentOpen(true)}>
              <IconDollar />
              Record payment
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {invoice.status !== 'paid' && (
            <DropdownMenuItem onSelect={() => setStatus('paid')}>
              <IconCircleCheck />
              Mark as paid
            </DropdownMenuItem>
          )}
          {invoice.status !== 'not_paid' && (
            <DropdownMenuItem onSelect={() => setStatus('not_paid')}>
              <IconClock />
              {invoice.status === 'draft' ? 'Mark as sent' : 'Mark as unpaid'}
            </DropdownMenuItem>
          )}
          {invoice.status !== 'draft' && (
            <DropdownMenuItem onSelect={() => setStatus('draft')}>
              <IconFileText />
              Move to drafts
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <IconTrashCan />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoiceId={invoice.id}
        currency={invoice.currency}
        balance={invoice.balance}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice {invoice.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              The client page stops working and its payments leave the dashboard. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={working}
              onClick={(event) => {
                event.preventDefault()
                start(() => deleteInvoiceAndReturn(invoice.id))
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  currency,
  balance,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  currency: string
  balance: string
}) {
  const [state, action, pending] = useActionState(recordPaymentAction, { error: null })

  useEffect(() => {
    if (!state.done) return
    onOpenChange(false)
    toast.success('Payment recorded')
    // Only react to a newly completed submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>For payments that arrived outside Stripe: bank transfers, crypto, cash.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="payment-amount">Amount</FieldLabel>
              <InputGroup>
                <InputGroupInput id="payment-amount" name="amount" inputMode="decimal" defaultValue={balance} className="tabular-nums" required />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{currency}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="payment-date">Date received</FieldLabel>
              <Input id="payment-date" name="paidAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="payment-note">Note</FieldLabel>
              <Input id="payment-note" name="note" placeholder="Wire reference, wallet transaction…" />
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
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const [working, start] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Remove payment"
      disabled={working}
      onClick={() =>
        start(async () => {
          await deletePaymentAction(paymentId)
          toast.success('Payment removed')
        })
      }
    >
      <IconTrashCan />
    </Button>
  )
}
