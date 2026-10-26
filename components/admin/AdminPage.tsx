import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./AdminPage.module.css";

export function AdminPage({ title, back, children }: { title: string; back: { href: string; label: string }; children: ReactNode }) {
  return (
    <>
      <header className={styles.topBar}>
        <div className={styles.inner}>
          <Link href={back.href} className={styles.back}>
            ← {back.label}
          </Link>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.inner}>
          <h1 className={styles.title}>{title}</h1>
          {children}
        </div>
      </main>
    </>
  );
}
