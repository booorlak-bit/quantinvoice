import "server-only";
import { Resend } from "resend";

/** Thrown when an email can't be sent; its text is safe to show. */
export class EmailError extends Error {}

/** What is missing to send email, or null when Resend is configured. */
export function emailConfigError() {
  if (!process.env.RESEND_API_KEY) return "Email isn’t set up yet: add RESEND_API_KEY on the server.";
  if (!process.env.EMAIL_FROM) return "Email isn’t set up yet: add EMAIL_FROM, like “fliq.email <hello@mail.yourdomain.com>”, on the server.";
  return null;
}

/** EMAIL_FROM split into its display name and address: "fliq.email <hello@mail.example.com>" or a bare address. */
function defaultSender() {
  const raw = (process.env.EMAIL_FROM ?? "").trim();
  const match = /^"?([^"<]*?)"?\s*<([^<>\s]+@[^<>\s]+)>$/.exec(raw);
  return match ? { name: match[1].trim(), address: match[2] } : { name: "", address: raw };
}

/** The domain EMAIL_FROM sends from, like mail.example.com. Brands send from their own name on it. */
export function sendingDomain() {
  const domain = defaultSender().address.split("@")[1];
  return domain ? domain.toLowerCase() : null;
}

// Addresses mail servers and people expect to reach the service itself; no brand may take them.
const RESERVED_SENDERS = [
  "abuse", "admin", "administrator", "fliq", "help", "hostmaster", "info", "mailer-daemon", "no-reply", "noreply",
  "postmaster", "root", "security", "support", "webmaster",
];

/** Why a brand can't use this sender name, or null when it can. */
export function senderProblem(sender: string) {
  if (sender.length > 40 || !/^[a-z0-9]+([._-][a-z0-9]+)*$/.test(sender)) {
    return "Use letters, digits, dots, dashes or underscores for the sender, like studio or max.design.";
  }
  const own = defaultSender().address.split("@")[0].toLowerCase();
  if (sender === own || RESERVED_SENDERS.includes(sender)) return `${sender}@ is reserved. Pick another name.`;
  return null;
}

/** "Name <address>", quoted when the name has punctuation (a comma or a dot would otherwise split or break it). */
function mailbox(name: string, address: string) {
  const clean = name.replace(/[\r\n"\\<>]/g, "").trim();
  if (!clean) return address;
  return /^[\p{L}\p{N} '!#$%&*+\-/=?^_`{|}~]+$/u.test(clean) ? `${clean} <${address}>` : `"${clean}" <${address}>`;
}

/** Who emails come from by default: EMAIL_FROM, formatted. */
export function defaultFrom() {
  const { name, address } = defaultSender();
  return address ? mailbox(name, address) : null;
}

/** "Brand <sender@domain>" for a brand with its own sender, or null to use EMAIL_FROM. */
export function brandFrom(brand: { name: string; sender: string | null }) {
  const domain = sendingDomain();
  if (!brand.sender || !domain) return null;
  return mailbox(brand.name, `${brand.sender}@${domain}`);
}

const ATTEMPTS = 3;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends one email with Resend. Network errors, 5xx and 429 are retried with backoff (429 honours retry-after); the
 * idempotency key makes a retry of the same message safe. Returns the Resend email ID.
 */
export async function sendEmail(message: {
  to: string[];
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  /** Defaults to EMAIL_FROM (see defaultFrom). */
  from?: string | null;
  replyTo?: string | null;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  for (let attempt = 1; ; attempt++) {
    const { data, error, headers } = await resend.emails.send(
      {
        from: message.from ?? defaultFrom()!,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo ?? undefined,
        attachments: message.attachments,
      },
      { idempotencyKey: message.idempotencyKey },
    );
    if (!error) {
      console.info(`[email] sent ${data?.id} (${message.idempotencyKey})`);
      return data?.id ?? null;
    }

    const status = error.statusCode;
    const retryable = status === null || status === 429 || status >= 500;
    if (!retryable || attempt >= ATTEMPTS) {
      console.error(`[email] failed (${message.idempotencyKey}): ${error.name} ${status ?? "network"}: ${error.message}`);
      throw new EmailError(
        retryable ? "The email wasn’t sent: Resend didn’t answer. Try again in a minute." : `The email wasn’t sent: ${error.message}`,
      );
    }
    const retryAfter = Number(headers?.["retry-after"]);
    await pause(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : 500 * 3 ** (attempt - 1));
  }
}
