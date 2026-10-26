import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const returnTo = typeof next === "string" ? next : "/";
  if (await isAdmin()) redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Enter the admin password to manage invoices.</p>
        <LoginForm next={returnTo} />
      </div>
    </main>
  );
}
