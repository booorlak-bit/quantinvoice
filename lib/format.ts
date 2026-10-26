import type { InvoiceItem } from "./types";

export function formatMoney(amount: string | number, currency: string, options: { compact?: boolean } = {}) {
  const value = Number(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      ...(options.compact ? { notation: "compact", maximumFractionDigits: 1 } : {}),
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Formats an ISO date (YYYY-MM-DD, or a timestamp) as "Sep 25, 2026" without timezone drift. */
export function formatDate(isoDate: string | null, options: { short?: boolean } = {}) {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(options.short ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Sums decimal strings in integer cents to avoid floating point drift. */
export function sumItems(items: Pick<InvoiceItem, "amount">[]) {
  const cents = items.reduce((total, item) => total + Math.round(Number(item.amount ?? 0) * 100), 0);
  return (cents / 100).toFixed(2);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
