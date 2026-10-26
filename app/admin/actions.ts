"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, requireAdmin } from "@/lib/auth";
import { createInvoice, deleteInvoice, saveBusiness, updateInvoice } from "@/lib/data";
import { slugify } from "@/lib/slug";
import { INVOICE_STATUSES, type InvoiceInput, type InvoiceStatus, type Note } from "@/lib/types";

export type FormState = { error: string | null };

class ValidationError extends Error {}

export async function saveInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  await requireAdmin(id ? `/admin/invoices/${id}` : "/admin/invoices/new");

  let input: InvoiceInput;
  try {
    input = parseInvoice(formData);
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    throw error;
  }

  try {
    if (id) await updateInvoice(id, input);
    else await createInvoice(input);
  } catch (error) {
    const constraint = (error as { constraint_name?: string }).constraint_name;
    if (constraint === "invoices_slug_key") return { error: "Another invoice already uses this URL slug." };
    if (constraint === "invoices_number_key") return { error: "Another invoice already uses this number." };
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/invoices/${input.slug}`);
}

export async function removeInvoice(formData: FormData) {
  const id = text(formData, "id");
  await requireAdmin(`/admin/invoices/${id}`);
  await deleteInvoice(id);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/settings");
  try {
    await saveBusiness({
      name: required(formData, "name", "Business name"),
      email: optionalEmail(formData, "email"),
      contactEmail: optionalEmail(formData, "contactEmail"),
      tagline: text(formData, "tagline") || null,
      logoUrl: optionalUrl(formData, "logoUrl", "Logo URL"),
      defaultCurrency: currency(formData, "defaultCurrency"),
      defaultNotes: notes(formData),
    });
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

function parseInvoice(formData: FormData): InvoiceInput {
  const title = required(formData, "title", "Title");
  const slug = slugify(text(formData, "slug") || title);
  if (!slug) throw new ValidationError("URL slug must contain letters or numbers.");

  const status = text(formData, "status") as InvoiceStatus;
  if (!INVOICE_STATUSES.includes(status)) throw new ValidationError("Unknown status.");

  const issueDate = date(formData, "issueDate", "Issue date");
  if (!issueDate) throw new ValidationError("Issue date is required.");
  const dueDate = date(formData, "dueDate", "Due date");
  if (dueDate && dueDate < issueDate) throw new ValidationError("Due date can't be before the issue date.");

  return {
    number: required(formData, "number", "Invoice number"),
    slug,
    title,
    status,
    clientName: required(formData, "clientName", "Client name"),
    clientEmail: optionalEmail(formData, "clientEmail"),
    issueDate,
    dueDate,
    currency: currency(formData, "currency"),
    taxNote: text(formData, "taxNote") || "Calculated at Checkout",
    paymentUrl: optionalUrl(formData, "paymentUrl", "Payment link"),
    paymentLabel: text(formData, "paymentLabel") || "Pay with Stripe",
    notes: notes(formData),
    items: items(formData),
  };
}

function items(formData: FormData) {
  const titles = formData.getAll("itemTitle").map(String);
  const descriptions = formData.getAll("itemDescription").map(String);
  const amounts = formData.getAll("itemAmount").map(String);
  const result = titles.flatMap((rawTitle, index) => {
    const title = rawTitle.trim();
    if (!title) return [];
    return [{ title, description: descriptions[index]?.trim() || null, amount: amount(amounts[index], title) }];
  });
  if (result.length === 0) throw new ValidationError("Add at least one line item.");
  return result;
}

function amount(raw: string | undefined, itemTitle: string) {
  const cleaned = (raw ?? "").replace(/[\s,$€£₽]/g, "");
  if (!cleaned) return null;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) {
    throw new ValidationError(`Amount for "${itemTitle}" must be a number like 4000 or 4000.50.`);
  }
  return Number(cleaned).toFixed(2);
}

function notes(formData: FormData): Note[] {
  const titles = formData.getAll("noteTitle").map(String);
  const bodies = formData.getAll("noteBody").map(String);
  return titles
    .map((title, index) => ({ title: title.trim(), body: (bodies[index] ?? "").trim() }))
    .filter((note) => note.title || note.body);
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function required(formData: FormData, key: string, label: string) {
  const value = text(formData, key);
  if (!value) throw new ValidationError(`${label} is required.`);
  if (value.length > 200) throw new ValidationError(`${label} is too long.`);
  return value;
}

function optionalEmail(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new ValidationError(`"${value}" is not a valid email.`);
  return value;
}

function optionalUrl(formData: FormData, key: string, label: string) {
  const value = text(formData, key);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {}
  throw new ValidationError(`${label} must be a full http(s) URL.`);
}

function currency(formData: FormData, key: string) {
  const value = text(formData, key).toUpperCase() || "USD";
  if (!/^[A-Z]{3}$/.test(value)) throw new ValidationError("Currency must be a 3-letter code like USD or EUR.");
  return value;
}

function date(formData: FormData, key: string, label: string) {
  const value = text(formData, key);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${label} is not a valid date.`);
  }
  return value;
}
