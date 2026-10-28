"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ensureProject } from "@/lib/data/clients";
import { createInvoice, deleteInvoices, deletePayment, getInvoice, markSent, recordPayment, setInvoicesStatus, updateInvoice } from "@/lib/data/invoices";
import { brandFrom, EmailError, emailConfigError, sendEmail } from "@/lib/email";
import { formatDate, formatMoney, sumItems } from "@/lib/format";
import { invoiceEmail } from "@/lib/invoice-email";
import { getPayOptions } from "@/lib/pay-options";
import { pdfFileName, renderInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { siteUrl } from "@/lib/site-url";
import { slugify } from "@/lib/slug";
import { INVOICE_STATUSES, INVOICE_STYLES, type InvoiceInput, type InvoiceStatus, type InvoiceStyle } from "@/lib/types";
import * as v from "@/lib/validation";

export type FormState = { error: string | null; done?: number };

export async function deleteInvoicesAction(ids: string[]) {
  const user = await requireUser("/invoices");
  const count = await deleteInvoices(user.id, ids);
  revalidatePath("/", "layout");
  return { count };
}

export async function deleteInvoiceAndReturn(id: string) {
  const user = await requireUser("/invoices");
  await deleteInvoices(user.id, [id]);
  revalidatePath("/", "layout");
  redirect("/invoices");
}

export async function setStatusAction(ids: string[], status: InvoiceStatus) {
  const user = await requireUser("/invoices");
  if (!INVOICE_STATUSES.includes(status)) throw new Error("Unknown status");
  await setInvoicesStatus(user.id, ids, status);
  revalidatePath("/", "layout");
}

export async function saveInvoiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = v.uuidOrNull(formData, "id");
  const user = await requireUser(id ? `/invoices/${id}/edit` : "/invoices/new");

  let input: InvoiceInput;
  try {
    input = await parseInvoice(user.id, formData, !id);
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
    throw error;
  }

  let invoiceId = id;
  try {
    if (id) await updateInvoice(user.id, id, input);
    else invoiceId = await createInvoice(user.id, input);
  } catch (error) {
    const constraint = v.uniqueViolation(error);
    if (constraint?.includes("slug")) return { error: "Another invoice already uses this page address. Change the page URL." };
    if (constraint?.includes("number")) return { error: "Another invoice already uses this number." };
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(id ? `/invoices/${invoiceId}` : `/invoices/${invoiceId}?created=1`);
}

async function parseInvoice(userId: string, formData: FormData, isNew: boolean): Promise<InvoiceInput> {
  const companyId = v.uuidOrNull(formData, "companyId");
  if (!companyId) throw new v.ValidationError("Choose the company this invoice is from.");
  const clientId = v.uuidOrNull(formData, "clientId");
  if (!clientId) throw new v.ValidationError("Choose a client or add a new one.");

  const title = v.required(formData, "title", "Title");
  let slug = slugify(v.text(formData, "slug"));
  if (!slug) {
    // Readable and hard to guess: the title plus a random suffix.
    const base = slugify(title) || "invoice";
    slug = `${base.slice(0, 60)}-${randomBytes(4).toString("hex")}`;
  } else if (isNew && slug === slugify(title)) {
    slug = `${slug.slice(0, 60)}-${randomBytes(4).toString("hex")}`;
  }

  const status = v.text(formData, "status") as InvoiceStatus;
  if (!INVOICE_STATUSES.includes(status)) throw new v.ValidationError("Choose a status.");
  const style = v.text(formData, "style") as InvoiceStyle;
  if (!INVOICE_STYLES.includes(style)) throw new v.ValidationError("Choose a style.");

  const issueDate = v.date(formData, "issueDate", "Issue date");
  if (!issueDate) throw new v.ValidationError("Issue date is required.");
  const dueDate = v.date(formData, "dueDate", "Due date");
  if (dueDate && dueDate < issueDate) throw new v.ValidationError("The due date can’t be before the issue date.");

  const items = v.items(formData);
  if (items.length === 0) throw new v.ValidationError("Add at least one line item.");

  const projectName = v.text(formData, "projectName").slice(0, 120);
  const project = projectName ? await ensureProject(userId, clientId, projectName) : null;

  const methodIds = formData
    .getAll("methodId")
    .map(String)
    .filter((value) => /^[0-9a-f-]{36}$/i.test(value));

  return {
    companyId,
    clientId,
    projectId: project?.id ?? null,
    templateId: v.uuidOrNull(formData, "templateId"),
    number: v.required(formData, "number", "Invoice number", 40),
    slug,
    title,
    status,
    issueDate,
    dueDate,
    currency: v.currency(formData, "currency"),
    taxNote: v.text(formData, "taxNote").slice(0, 120) || "Calculated at checkout",
    style,
    stripeLink: v.optionalUrl(formData, "stripeLink", "Stripe payment link"),
    notes: v.notes(formData),
    items,
    methodIds: [...new Set(methodIds)],
  };
}

export async function recordPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const invoiceId = v.uuidOrNull(formData, "invoiceId");
  const user = await requireUser(invoiceId ? `/invoices/${invoiceId}` : "/invoices");
  if (!invoiceId) return { error: "Invoice not found." };
  try {
    const value = v.amount(v.text(formData, "amount"), "this payment");
    if (!value || Number(value) <= 0) throw new v.ValidationError("Enter the amount received.");
    const paidAt = v.date(formData, "paidAt", "Payment date") ?? new Date().toISOString().slice(0, 10);
    await recordPayment(user.id, invoiceId, {
      amount: value,
      paidAt,
      methodId: v.uuidOrNull(formData, "methodId"),
      note: v.optional(formData, "note", 200),
    });
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { error: null, done: Date.now() };
}

export async function deletePaymentAction(paymentId: string) {
  const user = await requireUser("/invoices");
  await deletePayment(user.id, paymentId);
  revalidatePath("/", "layout");
}

/** Emails the invoice to the client: a message plus the page link, the PDF or both. */
export async function sendInvoiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = v.uuidOrNull(formData, "id");
  const user = await requireUser(id ? `/invoices/${id}` : "/invoices");
  const configError = emailConfigError();
  if (configError) return { error: configError };

  try {
    const invoice = id ? await getInvoice(user.id, id) : null;
    if (!invoice) throw new v.ValidationError("This invoice no longer exists.");
    const to = [...new Set(v.text(formData, "to").split(/[\s,;]+/).filter(Boolean).map((email) => email.toLowerCase()))];
    if (to.length === 0) throw new v.ValidationError("Add the client’s email.");
    if (to.length > 5) throw new v.ValidationError("Send to five addresses at most.");
    const invalid = to.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalid) throw new v.ValidationError(`“${invalid}” is not a valid email.`);
    const subject = v.required(formData, "subject", "Subject", 200);
    const message = v.optional(formData, "message", 5000) ?? "";
    const include = v.text(formData, "include");
    const withLink = include === "link" || include === "both";
    const withPdf = include === "pdf" || include === "both";
    if (!withLink && !withPdf) throw new v.ValidationError("Choose what to send: the link, the PDF or both.");

    const pageUrl = `${await siteUrl()}/i/${invoice.slug}`;
    const balance = Math.max(Number(sumItems(invoice.items)) - Number(invoice.paidTotal), 0);
    const pdf = withPdf ? await renderInvoicePdf(invoice, await getPayOptions({ ...invoice, userId: user.id }), pageUrl) : null;
    const email = invoiceEmail({
      companyName: invoice.company.name,
      message,
      number: invoice.number,
      title: invoice.title,
      amount: formatMoney(balance, invoice.currency),
      dueDate: formatDate(invoice.dueDate),
      pageUrl: withLink ? pageUrl : null,
      hasPdf: Boolean(pdf),
    });
    await sendEmail({
      to,
      subject,
      ...email,
      from: brandFrom(invoice.company),
      replyTo: invoice.company.contactEmail ?? invoice.company.email,
      attachments: pdf ? [{ filename: pdfFileName(invoice), content: pdf }] : undefined,
      // One key per press of Send: retries inside sendEmail reuse it, a new send gets a new one.
      idempotencyKey: `invoice/${invoice.id}/${randomUUID()}`,
    });
    await markSent(user.id, invoice.id, to);
  } catch (error) {
    if (error instanceof v.ValidationError || error instanceof EmailError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { error: null, done: Date.now() };
}
