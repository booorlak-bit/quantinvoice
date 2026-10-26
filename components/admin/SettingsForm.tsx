"use client";

import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { Business } from "@/lib/types";
import { NotesEditor } from "./NotesEditor";
import styles from "./form.module.css";

export function SettingsForm({ initial }: { initial: Business }) {
  const [state, action, pending] = useActionState(saveSettings, { error: null });
  const [values, setValues] = useState({
    name: initial.name,
    email: initial.email ?? "",
    contactEmail: initial.contactEmail ?? "",
    tagline: initial.tagline ?? "",
    logoUrl: initial.logoUrl ?? "",
    defaultCurrency: initial.defaultCurrency,
  });
  const field = (key: keyof typeof values) => ({
    name: key,
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: e.target.value })),
  });

  return (
    <form action={action} className={styles.form}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Invoice From</h2>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>Business name</span>
            <input required {...field("name")} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email on invoices</span>
            <input type="email" {...field("email")} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>“Get in Touch” email</span>
            <input type="email" placeholder="Same as above" {...field("contactEmail")} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Tagline</span>
            <input placeholder="Invoice Manager" {...field("tagline")} />
          </label>
          <label className={`${styles.field} ${styles.wide}`}>
            <span className={styles.label}>Logo URL</span>
            <input type="url" placeholder="https://…/logo.png" {...field("logoUrl")} />
            <span className={styles.hint}>Square image. Without a logo, invoices show a black tile with the business name.</span>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Default currency</span>
            <input maxLength={3} required {...field("defaultCurrency")} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Default notes</h2>
        <p className={styles.hint}>Prefilled on every new invoice.</p>
        <NotesEditor initial={initial.defaultNotes} />
      </section>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        <Link href="/" className={styles.secondaryButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
