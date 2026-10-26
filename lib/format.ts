import type { InvoiceItem, InvoiceStatus } from "./types";

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  not_paid: "Not Paid",
  paid: "Paid",
};

export function formatMoney(amount: string | number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
  } catch {
    return `${Number(amount).toFixed(2)} ${currency}`;
  }
}

/** Formats an ISO date (YYYY-MM-DD) as "Sep 25, 2023" without timezone drift. */
export function formatDate(isoDate: string | null) {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Sums decimal strings in integer cents to avoid floating point drift. */
export function sumItems(items: InvoiceItem[]) {
  const cents = items.reduce((total, item) => total + Math.round(Number(item.amount ?? 0) * 100), 0);
  return (cents / 100).toFixed(2);
}
