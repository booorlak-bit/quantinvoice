import styles from "./BusinessLogo.module.css";

type Props = { name: string; logoUrl: string | null; size: "large" | "mark" };

/** Renders the uploaded logo, or a monochrome tile with the business name. */
export function BusinessLogo({ name, logoUrl, size }: Props) {
  if (logoUrl) {
    // Logos are arbitrary user-provided URLs, so next/image remote patterns can't cover them.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles[size]} src={logoUrl} alt={name} />;
  }
  return (
    <span className={`${styles[size]} ${styles.tile}`} aria-label={name}>
      {size === "mark" ? name.charAt(0).toUpperCase() : name}
    </span>
  );
}
