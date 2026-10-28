'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { IconArrowLeft, IconChainLink1, IconChevronRightMedium, IconEmail1, IconFileDownload, IconShareOs } from 'central-icons'

import { sendInvoiceAction } from '@/app/(app)/invoices/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { submitWithoutReset } from '@/lib/submit'
import type { InvoiceStatus } from '@/lib/types'

export type ShareInvoice = {
  id: string
  slug: string
  number: string
  title: string
  status: InvoiceStatus
  amountDue: string
  dueDate: string
  companyName: string
  /** Who the email comes from, like "Studio <studio@mail.example.com>". */
  from: string | null
  clientName: string
  clientEmail: string | null
}

type Include = 'link' | 'pdf' | 'both'

function defaultMessage(invoice: ShareInvoice) {
  const firstName = invoice.clientName.split(/\s+/)[0] || 'there'
  return `Hi ${firstName},\n\nHere is invoice ${invoice.number} for ${invoice.title}: ${invoice.amountDue}, due ${invoice.dueDate}.\n\nThank you!\n${invoice.companyName}`
}

/** "Share" on an invoice: copy the link, download the PDF, or email it with a message (link, PDF or both). */
export function ShareButton({ invoice, emailError, defaultOpen = false }: { invoice: ShareInvoice; emailError: string | null; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [step, setStep] = useState<'choose' | 'email'>('choose')

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <IconShareOs />
        Share
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setStep('choose')
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          {step === 'choose' ? (
            <ChooseStep invoice={invoice} onEmail={() => setStep('email')} />
          ) : (
            <EmailStep invoice={invoice} emailError={emailError} onBack={() => setStep('choose')} onSent={() => setOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ChooseStep({ invoice, onEmail }: { invoice: ShareInvoice; onEmail: () => void }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/i/${invoice.slug}`)
      toast.success('Link copied')
    } catch {
      toast.error('Couldn’t copy the link.')
    }
  }
  const options = [
    { key: 'link', icon: IconChainLink1, title: 'Copy link', description: 'The invoice page, where the client can pay.', onClick: copy },
    { key: 'pdf', icon: IconFileDownload, title: 'Download PDF', description: 'With payment details, ready to attach anywhere.', href: `/invoices/${invoice.id}/pdf` },
    {
      key: 'email',
      icon: IconEmail1,
      title: 'Send by email',
      description: invoice.clientEmail ? `To ${invoice.clientEmail}, with your message.` : 'With your message, the link or the PDF.',
      onClick: onEmail,
    },
  ]
  return (
    <>
      <DialogHeader>
        <DialogTitle>Share {invoice.number}</DialogTitle>
        <DialogDescription>
          {invoice.status === 'draft' ? 'It’s a draft, so the link only opens for you until you send it or mark it as sent.' : `${invoice.amountDue} due ${invoice.dueDate}.`}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const body = (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg]:size-4">
                <option.icon />
              </span>
              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-sm font-medium text-foreground">{option.title}</span>
                <span className="text-xs font-normal whitespace-normal text-muted-foreground">{option.description}</span>
              </span>
              <IconChevronRightMedium className="text-muted-foreground" />
            </>
          )
          return option.href ? (
            <Button key={option.key} asChild variant="outline" className="h-auto justify-start gap-3 py-2.5">
              <a href={option.href} download>
                {body}
              </a>
            </Button>
          ) : (
            <Button key={option.key} variant="outline" className="h-auto justify-start gap-3 py-2.5" onClick={option.onClick}>
              {body}
            </Button>
          )
        })}
      </div>
    </>
  )
}

function EmailStep({
  invoice,
  emailError,
  onBack,
  onSent,
}: {
  invoice: ShareInvoice
  emailError: string | null
  onBack: () => void
  onSent: () => void
}) {
  const [state, action, pending] = useActionState(sendInvoiceAction, { error: null })
  const [include, setInclude] = useState<Include>('both')
  const [to, setTo] = useState(invoice.clientEmail ?? '')

  useEffect(() => {
    if (!state.done) return
    toast.success(`Sent to ${to}`)
    onSent()
    // Only react to a newly sent email.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done])

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={invoice.id} />
      <input type="hidden" name="include" value={include} />
      <DialogHeader>
        <DialogTitle>Email {invoice.number}</DialogTitle>
        <DialogDescription>{invoice.from ? `From ${invoice.from}. ` : ''}Replies go to the brand’s email.</DialogDescription>
      </DialogHeader>
      {emailError && (
        <Alert>
          <AlertDescription>{emailError}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="share-to">To</FieldLabel>
          <Input id="share-to" name="to" value={to} onChange={(event) => setTo(event.target.value)} placeholder="client@example.com" required autoComplete="off" />
          <FieldDescription>Separate several addresses with commas.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="share-subject">Subject</FieldLabel>
          <Input id="share-subject" name="subject" required defaultValue={`Invoice ${invoice.number} from ${invoice.companyName}`} />
        </Field>
        <Field>
          <FieldLabel htmlFor="share-message">Message</FieldLabel>
          <Textarea id="share-message" name="message" rows={7} defaultValue={defaultMessage(invoice)} />
        </Field>
        <Field>
          <FieldLabel id="share-include-label">Send</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={include}
            onValueChange={(next) => next && setInclude(next as Include)}
            aria-labelledby="share-include-label"
            className="w-full"
          >
            <ToggleGroupItem value="link" className="flex-1">
              Link
            </ToggleGroupItem>
            <ToggleGroupItem value="pdf" className="flex-1">
              PDF
            </ToggleGroupItem>
            <ToggleGroupItem value="both" className="flex-1">
              Link and PDF
            </ToggleGroupItem>
          </ToggleGroup>
          <FieldDescription>
            {include === 'link' ? 'A button to the invoice page, where the client can pay.' : include === 'pdf' ? 'The invoice as a PDF attachment.' : 'A button to the invoice page and the PDF attached.'}
            {invoice.status === 'draft' && ' Sending marks the draft as unpaid so the client can open it.'}
          </FieldDescription>
        </Field>
      </FieldGroup>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onBack}>
          <IconArrowLeft />
          Back
        </Button>
        <Button type="submit" loading={pending} disabled={Boolean(emailError)}>
          Send
        </Button>
      </DialogFooter>
    </form>
  )
}
