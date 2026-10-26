import { Badge, type BadgeColor } from '@/components/ui/badge'
import type { InvoiceStatus } from '@/lib/types'

const LOOK: Record<InvoiceStatus | 'overdue', { label: string; color: BadgeColor }> = {
  draft: { label: 'Draft', color: 'neutral' },
  not_paid: { label: 'Unpaid', color: 'amber' },
  overdue: { label: 'Overdue', color: 'red' },
  paid: { label: 'Paid', color: 'green' },
}

export function InvoiceStatusBadge({ status, overdue = false, className }: { status: InvoiceStatus; overdue?: boolean; className?: string }) {
  const look = LOOK[status === 'not_paid' && overdue ? 'overdue' : status]
  return (
    <Badge color={look.color} className={className}>
      {look.label}
    </Badge>
  )
}
