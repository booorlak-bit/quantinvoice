import type { InvoiceItem, Note } from "./types";

/** Thrown for input the user can fix; its message is shown in the form. */
export class ValidationError extends Error {}

export function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function required(formData: FormData, key: string, label: string, max = 200) {
  const value = text(formData, key);
  if (!value) throw new ValidationError(`${label} is required.`);
  if (value.length > max) throw new ValidationError(`${label} is too long.`);
  return value;
}

export function optional(formData: FormData, key: string, max = 2000) {
  const value = text(formData, key);
  if (value.length > max) throw new ValidationError("A field is too long.");
  return value || null;
}

export function optionalEmail(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new ValidationError(`“${value}” is not a valid email.`);
  return value.toLowerCase();
}

export function optionalUrl(formData: FormData, key: string, label: string) {
  const value = text(formData, key);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {}
  throw new ValidationError(`${label} must be a full link starting with https://.`);
}

export function currency(formData: FormData, key: string) {
  const value = text(formData, key).toUpperCase() || "USD";
  if (!/^[A-Z]{3}$/.test(value)) throw new ValidationError("Currency must be a 3-letter code like USD or EUR.");
  return value;
}

export function date(formData: FormData, key: string, label: string) {
  const value = text(formData, key);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${label} is not a valid date.`);
  }
  return value;
}

export function amount(raw: string | undefined, label: string) {
  const cleaned = (raw ?? "").replace(/[\s,$€£₽]/g, "");
  if (!cleaned) return null;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) {
    throw new ValidationError(`Amount for “${label}” must be a number like 4000 or 4000.50.`);
  }
  return Number(cleaned).toFixed(2);
}

export function items(formData: FormData): InvoiceItem[] {
  const titles = formData.getAll("itemTitle").map(String);
  const descriptions = formData.getAll("itemDescription").map(String);
  const amounts = formData.getAll("itemAmount").map(String);
  return titles.flatMap((rawTitle, index) => {
    const title = rawTitle.trim();
    if (!title) return [];
    return [{ title, description: descriptions[index]?.trim() || null, amount: amount(amounts[index], title) }];
  });
}

export function notes(formData: FormData): Note[] {
  const titles = formData.getAll("noteTitle").map(String);
  const bodies = formData.getAll("noteBody").map(String);
  return titles
    .map((title, index) => ({ title: title.trim(), body: (bodies[index] ?? "").trim() }))
    .filter((note) => note.title || note.body);
}

export function uuidOrNull(formData: FormData, key: string) {
  const value = text(formData, key);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

/** Postgres unique-violation constraint name, if the error is one. */
export function uniqueViolation(error: unknown) {
  const pg = error as { code?: string; constraint_name?: string };
  return pg.code === "23505" ? (pg.constraint_name ?? "unique") : null;
}
