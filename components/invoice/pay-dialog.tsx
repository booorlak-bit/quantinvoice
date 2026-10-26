'use client'

import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { IconExclamationTriangle, IconSquareArrowTopRight, IconSquareBehindSquare1 } from 'central-icons'

import { METHOD_KINDS } from '@/components/payment-methods/kinds'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PaymentMethod } from '@/lib/types'

/** A payment method as offered on one invoice: Stripe links already resolved, crypto with its QR code. */
export type PayOption = PaymentMethod & { qr?: string }

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          toast.success(`${label} copied`)
        } catch {
          toast.error('Couldn’t copy. Select the text instead.')
        }
      }}
    >
      <IconSquareBehindSquare1 />
    </Button>
  )
}

function DetailRow({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={mono ? 'font-mono text-sm break-all' : 'text-sm font-medium break-words'}>{value}</dd>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  )
}

function OptionBody({ option, amount, invoiceNumber }: { option: PayOption; amount: string; invoiceNumber: string }) {
  switch (option.type) {
    case 'stripe':
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Pay securely by card through Stripe. The page opens in a new tab.</p>
          <Button asChild size="lg">
            <a href={option.details.url} target="_blank" rel="noopener noreferrer">
              Pay {amount} by card
              <IconSquareArrowTopRight />
            </a>
          </Button>
        </div>
      )
    case 'link':
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Opens {option.name} in a new tab. Pay {amount}.</p>
          <Button asChild size="lg">
            <a href={option.details.url} target="_blank" rel="noopener noreferrer">
              {option.details.label}
              <IconSquareArrowTopRight />
            </a>
          </Button>
        </div>
      )
    case 'crypto':
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            {option.qr && (
              // A plain image: the QR code is generated on the server as an SVG with its own white quiet zone.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={option.qr} alt={`QR code for the ${option.details.asset} address`} className="size-40 shrink-0 rounded-lg" />
            )}
            <dl className="flex w-full min-w-0 flex-col divide-y divide-border">
              <DetailRow label="Amount" value={`${amount} in ${option.details.asset}`} />
              <DetailRow label="Network" value={option.details.network} />
              <DetailRow label="Address" value={option.details.address} mono />
              <DetailRow label="Memo" value={option.details.memo} mono />
            </dl>
          </div>
          <Alert>
            <IconExclamationTriangle />
            <AlertDescription>
              Send {option.details.asset} on {option.details.network} only. Coins sent on another network can’t be recovered.
            </AlertDescription>
          </Alert>
        </div>
      )
    case 'bank': {
      const details = option.details
      return (
        <dl className="flex flex-col divide-y divide-border">
          <DetailRow label="Amount" value={amount} />
          <DetailRow label="Account holder" value={details.accountHolder} />
          <DetailRow label="Bank" value={details.bankName} />
          <DetailRow label="IBAN" value={details.iban} mono />
          <DetailRow label="Account number" value={details.accountNumber} mono />
          <DetailRow label="SWIFT / BIC" value={details.swift} mono />
          <DetailRow label="Routing or sort code" value={details.routingNumber} mono />
          <DetailRow label="Bank address" value={details.bankAddress} />
          <DetailRow label="Reference" value={details.reference || invoiceNumber} />
        </dl>
      )
    }
  }
}

/**
 * "Pay" on the public invoice: one tab per payment method. The dialog portals into the invoice page so it keeps the
 * invoice's theme (and escapes the blurred pay bar, which would trap a fixed overlay).
 */
export function PayDialog({
  options,
  amount,
  invoiceNumber,
  trigger,
}: {
  options: PayOption[]
  amount: string
  invoiceNumber: string
  trigger: ReactNode
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  return (
    <Dialog onOpenChange={(open) => open && setContainer(document.getElementById('invoice-page'))}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent container={container} className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pay invoice {invoiceNumber}</DialogTitle>
          <DialogDescription>{amount} due. Choose how you’d like to pay.</DialogDescription>
        </DialogHeader>
        {options.length === 1 ? (
          <OptionBody option={options[0]} amount={amount} invoiceNumber={invoiceNumber} />
        ) : (
          <Tabs defaultValue={options[0].id} className="gap-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              {options.map((option) => {
                const Icon = METHOD_KINDS[option.type].icon
                return (
                  <TabsTrigger key={option.id} value={option.id} className="flex-none sm:flex-1">
                    <Icon />
                    {option.name}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {options.map((option) => (
              <TabsContent key={option.id} value={option.id}>
                <OptionBody option={option} amount={amount} invoiceNumber={invoiceNumber} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
