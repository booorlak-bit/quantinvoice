import "server-only";
import { Resend } from "resend";

/** Thrown when an email can't be sent; its text is safe to show. */
export class EmailError extends Error {}

/** What is missing to send email, or null when Resend is configured. */
export function emailConfigError() {
  if (!process.env.RESEND_API_KEY) return "Email isn’t set up yet: add RESEND_API_KEY on the server.";
  if (!process.env.EMAIL_FROM) return "Email isn’t set up yet: add EMAIL_FROM, like “Quantum <billing@yourdomain.com>”, on the server.";
  return null;
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
  replyTo?: string | null;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  for (let attempt = 1; ; attempt++) {
    const { data, error, headers } = await resend.emails.send(
      {
        from: process.env.EMAIL_FROM!,
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
