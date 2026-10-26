import "server-only";

/** Thrown when an email can't be sent; its text is safe to show. */
export class EmailError extends Error {}

/** What is missing to send email, or null when Resend is configured. */
export function emailConfigError() {
  if (!process.env.RESEND_API_KEY) return "Email isn’t set up yet: add RESEND_API_KEY on the server.";
  if (!process.env.EMAIL_FROM) return "Email isn’t set up yet: add EMAIL_FROM, like “Quantum <billing@yourdomain.com>”, on the server.";
  return null;
}

export async function sendEmail(message: {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  attachments?: { filename: string; content: Buffer }[];
}) {
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo ?? undefined,
        attachments: message.attachments?.map((file) => ({ filename: file.filename, content: file.content.toString("base64") })),
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new EmailError("The email wasn’t sent: Resend didn’t answer. Try again in a minute.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new EmailError(`The email wasn’t sent: ${body?.message ?? `Resend answered ${response.status}`}.`);
  }
}
