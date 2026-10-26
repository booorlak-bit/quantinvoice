import { STATUS_LABELS } from "@/lib/format";
import type { InvoiceStatus } from "@/lib/types";
import styles from "./StatusBadge.module.css";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <span className={`${styles.badge} ${styles[status]}`}>{STATUS_LABELS[status]}</span>;
}
