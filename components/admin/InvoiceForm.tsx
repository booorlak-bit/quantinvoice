"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { removeInvoice, saveInvoice } from "@/app/admin/actions";
import { formatMoney, STATUS_LABELS, sumItems } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { INVOICE_STATUSES, type InvoiceStatus, type Note } from "@/lib/types";
import { NotesEditor } from "./NotesEditor";
import styles from "./form.module.css";

export type InvoiceFormValues = {
  id?: string;
  number: string;
  slug: string;
  title: string;
  status: InvoiceStatus;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  taxNote: string;
  paymentUrl: string;
  paymentLabel: string;
  notes: Note[];
  items: { title: string; description: string; amount: string }[];
};

type Row<T> = T & { key: number };
let nextKey = 0;
const withKey = <T,>(value: T): Row<T> => ({ ...value, key: nextKey++ });

export function InvoiceForm({ initial }: { initial: InvoiceFormValues }) {
  const [state, action, pending] = useActionState(saveInvoice, { error: null });
  const [values, setValues] = useState(initial);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.id));
  const [items, setItems] = useState(() =>
    (initial.items.length ? initial.items : [{ title: "", description: "", amount: "" }]).map(withKey),
  );

  const set = <K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const updateItem = (key: number, patch: Partial<InvoiceFormValues["items"][number]>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const parsedAmounts = items.map((item) => ({
    ...item,
    amount: /^\d+(\.\d{1,2})?$/.test(item.amount.replace(/[\s,]/g, "")) ? item.amount.replace(/[\s,]/g, "") : null,
  }));
  const currencyValid = /^[A-Z]{3}$/.test(values.currency);

  return (
    <>
      <form action={action} className={styles.form}>
        {values.id && <input type="hidden" name="id" value={values.id} />}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Details</h2>
          <div className={styles.grid}>
            <Field label="Invoice number">
              <input name="number" required value={values.number} onChange={(e) => set("number", e.target.value)} />
            </Field>
            <Field label="Status">
              <select
                name="status"
                value={values.status}
                onChange={(e) => set("status", e.target.value as InvoiceStatus)}
              >
                {INVOICE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title" wide>
              <input
                name="title"
                required
                value={values.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setValues((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugify(title) }));
                }}
              />
            </Field>
            <Field label="Page URL" hint={`/invoices/${values.slug || "…"}`} wide>
              <input
                name="slug"
                value={values.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  set("slug", e.target.value);
                }}
              />
            </Field>
            <Field label="Issue date">
              <input
                name="issueDate"
                type="date"
                required
                value={values.issueDate}
                onChange={(e) => set("issueDate", e.target.value)}
              />
            </Field>
            <Field label="Due date">
              <input name="dueDate" type="date" value={values.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Invoice For</h2>
          <div className={styles.grid}>
            <Field label="Client name">
              <input
                name="clientName"
                required
                value={values.clientName}
                onChange={(e) => set("clientName", e.target.value)}
              />
            </Field>
            <Field label="Client email">
              <input
                name="clientEmail"
                type="email"
                value={values.clientEmail}
                onChange={(e) => set("clientEmail", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Breakdown</h2>
          <p className={styles.hint}>Leave the amount empty to show the item as “Included”.</p>
          <ul className={styles.rows}>
            {items.map((item, index) => (
              <li key={item.key} className={styles.itemRow}>
                <input
                  name="itemTitle"
                  placeholder="Item"
                  aria-label={`Item ${index + 1} title`}
                  value={item.title}
                  onChange={(e) => updateItem(item.key, { title: e.target.value })}
                />
                <input
                  name="itemDescription"
                  placeholder="Description"
                  aria-label={`Item ${index + 1} description`}
                  value={item.description}
                  onChange={(e) => updateItem(item.key, { description: e.target.value })}
                />
                <input
                  name="itemAmount"
                  placeholder="Included"
                  inputMode="decimal"
                  aria-label={`Item ${index + 1} amount`}
                  value={item.amount}
                  onChange={(e) => updateItem(item.key, { amount: e.target.value })}
                />
                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={`Remove item ${index + 1}`}
                  disabled={items.length === 1}
                  onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setItems((current) => [...current, withKey({ title: "", description: "", amount: "" })])}
          >
            + Add item
          </button>
          <p className={styles.subtotal}>
            <span className="muted">Total</span>
            <span>{formatMoney(sumItems(parsedAmounts), currencyValid ? values.currency : "USD")}</span>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Payment</h2>
          <div className={styles.grid}>
            <Field label="Currency" hint="3-letter code: USD, EUR, RUB…">
              <input
                name="currency"
                required
                maxLength={3}
                value={values.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Tax line">
              <input name="taxNote" value={values.taxNote} onChange={(e) => set("taxNote", e.target.value)} />
            </Field>
            <Field label="Payment link" hint="Stripe Payment Link, PayPal.me or any checkout URL">
              <input
                name="paymentUrl"
                type="url"
                placeholder="https://buy.stripe.com/…"
                value={values.paymentUrl}
                onChange={(e) => set("paymentUrl", e.target.value)}
              />
            </Field>
            <Field label="Button label">
              <input
                name="paymentLabel"
                value={values.paymentLabel}
                onChange={(e) => set("paymentLabel", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notes</h2>
          <NotesEditor initial={initial.notes} />
        </section>

        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Saving…" : values.id ? "Save changes" : "Create invoice"}
          </button>
          <Link href={values.id ? `/invoices/${initial.slug}` : "/"} className={styles.secondaryButton}>
            Cancel
          </Link>
        </div>
      </form>

      {values.id && (
        <form
          action={removeInvoice}
          className={styles.dangerZone}
          onSubmit={(event) => {
            if (!confirm(`Delete invoice ${initial.number}? This can't be undone.`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={values.id} />
          <button type="submit" className={styles.deleteButton}>
            Delete invoice
          </button>
        </form>
      )}
    </>
  );
}

function Field({
  label,
  hint,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={wide ? `${styles.field} ${styles.wide}` : styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}
