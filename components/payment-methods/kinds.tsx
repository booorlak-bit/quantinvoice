import { IconBank, IconBitcoin, IconChainLink1, IconCreditCard1 } from 'central-icons'

import type { PaymentMethod, PaymentMethodType } from '@/lib/types'

export const METHOD_KINDS: Record<PaymentMethodType, { label: string; description: string; icon: typeof IconBank }> = {
  stripe: { label: 'Stripe', description: 'Card payments through your Stripe Payment Link', icon: IconCreditCard1 },
  crypto: { label: 'Crypto wallet', description: 'A wallet address with a QR code', icon: IconBitcoin },
  bank: { label: 'Bank transfer', description: 'Account details for a wire or SEPA transfer', icon: IconBank },
  link: { label: 'Other link', description: 'PayPal, Wise or any payment page', icon: IconChainLink1 },
}

/** "TQx4…9fPa" for long addresses and account numbers. */
export function shorten(value: string, keep = 4) {
  return value.length > keep * 2 + 3 ? `${value.slice(0, keep)}…${value.slice(-keep)}` : value
}

function host(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`
  } catch {
    return url
  }
}

/** One line that tells methods of the same kind apart. */
export function methodSummary(method: PaymentMethod) {
  switch (method.type) {
    case 'stripe':
      return shorten(host(method.details.url), 14)
    case 'crypto':
      return `${method.details.asset} · ${method.details.network} · ${shorten(method.details.address)}`
    case 'bank': {
      const account = method.details.iban ?? method.details.accountNumber ?? ''
      return [method.details.bankName, account && `•••• ${account.slice(-4)}`].filter(Boolean).join(' · ')
    }
    case 'link':
      return shorten(host(method.details.url), 14)
  }
}
