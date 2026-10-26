import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Not found</h1>
      <p className="muted">This invoice doesn’t exist or is no longer available.</p>
      <Link href="/" className={styles.link}>
        Go home
      </Link>
    </main>
  );
}
