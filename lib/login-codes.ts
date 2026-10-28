import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { sql } from "./db";

export const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_AFTER_SECONDS = 60;

// Codes are stored only as HMACs keyed with the session secret, so a database dump doesn't reveal them.
function hashCode(email: string, code: string) {
  return createHmac("sha256", `${process.env.SESSION_SECRET}:login-code`).update(`${email}:${code}`).digest("base64url");
}

/** Who may create an account: SIGNUP_EMAILS lists emails or @domains; unset means anyone. Existing accounts always sign in. */
export function signupAllowed(email: string) {
  const list = (process.env.SIGNUP_EMAILS ?? "")
    .split(/[\s,;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return true;
  return list.some((entry) => (entry.startsWith("@") ? email.endsWith(entry) : email === entry));
}

export type IssuedCode = { ok: true; code: string; id: string } | { ok: false; error: string };

/** Creates a 6-digit code for the email, unless the email or the IP asked too often. Earlier codes stop working. */
export async function issueLoginCode(email: string, ip: string | null): Promise<IssuedCode> {
  const [limits] = await sql<{ lastSeconds: number | null; emailHour: number; ipHour: number }[]>`
    select
      (select extract(epoch from now() - max(created_at))::int from login_codes where email = ${email}) as last_seconds,
      (select count(*)::int from login_codes where email = ${email} and created_at > now() - interval '1 hour') as email_hour,
      (select count(*)::int from login_codes where ip = ${ip} and created_at > now() - interval '1 hour') as ip_hour
  `;
  if (limits.lastSeconds !== null && limits.lastSeconds < RESEND_AFTER_SECONDS) {
    return { ok: false, error: `A code was just sent. You can ask for a new one in ${RESEND_AFTER_SECONDS - limits.lastSeconds} seconds.` };
  }
  if (limits.emailHour >= 5 || limits.ipHour >= 20) return { ok: false, error: "Too many codes requested. Try again in an hour." };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const id = await sql.begin(async (tx) => {
    await tx`delete from login_codes where created_at < now() - interval '1 day'`;
    await tx`update login_codes set used_at = now() where email = ${email} and used_at is null`;
    const [row] = await tx<{ id: string }[]>`
      insert into login_codes (email, code_hash, ip, expires_at)
      values (${email}, ${hashCode(email, code)}, ${ip}, now() + ${CODE_TTL_MINUTES} * interval '1 minute')
      returning id
    `;
    return row.id;
  });
  return { ok: true, code, id };
}

export type CodeCheck = "ok" | "invalid" | "expired" | "locked";

/** Checks the latest code for the email and uses it up on success. Each code allows a few wrong attempts. */
export async function consumeLoginCode(email: string, code: string): Promise<CodeCheck> {
  return sql.begin(async (tx) => {
    const [row] = await tx<{ id: string; codeHash: string; attempts: number; expired: boolean }[]>`
      select id, code_hash, attempts, expires_at < now() as expired
      from login_codes where email = ${email} and used_at is null
      order by created_at desc limit 1
      for update
    `;
    if (!row || row.expired) return "expired";
    if (row.attempts >= MAX_ATTEMPTS) return "locked";

    const expected = Buffer.from(row.codeHash);
    const actual = Buffer.from(hashCode(email, code));
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) {
      await tx`update login_codes set used_at = now() where id = ${row.id}`;
      return "ok";
    }
    await tx`update login_codes set attempts = attempts + 1 where id = ${row.id}`;
    return row.attempts + 1 >= MAX_ATTEMPTS ? "locked" : "invalid";
  });
}

/** The email that carries a sign-in code. Inline styles and literal colours only: email clients ignore stylesheets. */
export function loginCodeEmail(code: string) {
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;color:#171717;font-size:15px;line-height:1.5">
<div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:14px;padding:28px">
<p style="margin:0 0 16px;font-weight:600">Quantinvoice</p>
<p style="margin:0 0 16px">Your sign-in code:</p>
<p style="margin:0 0 16px;font-size:32px;font-weight:600;letter-spacing:6px;font-family:ui-monospace,Menlo,monospace">${code}</p>
<p style="margin:0;color:#737373;font-size:13px">It expires in ${CODE_TTL_MINUTES} minutes. If you didn’t ask for it, ignore this email.</p>
</div></body></html>`;
  const text = `Your Quantinvoice sign-in code: ${code}\n\nIt expires in ${CODE_TTL_MINUTES} minutes. If you didn’t ask for it, ignore this email.`;
  return { subject: `${code} is your Quantinvoice code`, html, text };
}
