"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfigError, endSession, requireUser, safeReturnPath, startSession } from "@/lib/auth";
import { findOrCreateUser, hasBrand, setUpWorkspace, userExists } from "@/lib/data/users";
import { EmailError, emailConfigError, sendEmail } from "@/lib/email";
import { consumeLoginCode, issueLoginCode, loginCodeEmail, signupAllowed, type CodeCheck } from "@/lib/login-codes";
import * as v from "@/lib/validation";

/** `at` orders the two steps' results, so the form shows whichever happened last. */
export type CodeState = { step: "email" | "code"; email: string; error: string | null; sentAt?: number; at?: number };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slowDown = () => new Promise((resolve) => setTimeout(resolve, 600));

/** Step 1: email a 6-digit code. The same code signs in an existing account or creates a new one. */
export async function requestCodeAction(prev: CodeState, formData: FormData): Promise<CodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fail = (error: string): CodeState => ({
    step: prev.step === "code" && prev.email === email ? "code" : "email",
    email,
    error,
    sentAt: prev.sentAt,
    at: Date.now(),
  });

  const configError = authConfigError();
  if (configError) return fail(configError);
  if (!EMAIL.test(email)) return fail("Enter a valid email.");

  // Locally, without Resend, LOGIN_CODES_TO_CONSOLE=1 prints codes to the server log instead.
  const deliveryError = emailConfigError();
  const toConsole = Boolean(deliveryError) && process.env.LOGIN_CODES_TO_CONSOLE === "1";
  if (deliveryError && !toConsole) return fail("Email sign-in isn’t set up yet: the server needs RESEND_API_KEY and EMAIL_FROM.");
  if (!signupAllowed(email) && !(await userExists(email))) return fail("This email can’t create an account here.");

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const issued = await issueLoginCode(email, ip);
  if (!issued.ok) return fail(issued.error);

  if (toConsole) {
    console.info(`[login code] ${email}: ${issued.code}`);
  } else {
    try {
      const message = loginCodeEmail(issued.code);
      await sendEmail({ to: [email], ...message });
    } catch (error) {
      if (error instanceof EmailError) return fail(error.message);
      throw error;
    }
  }
  return { step: "code", email, error: null, sentAt: Date.now(), at: Date.now() };
}

const CODE_ERRORS: Record<Exclude<CodeCheck, "ok">, string> = {
  invalid: "That code isn’t right. Check the latest email and try again.",
  expired: "This code has expired. Send a new one.",
  locked: "Too many wrong attempts. Send a new code.",
};

/** Step 2: check the code, start the session, and send new accounts to the welcome step. */
export async function verifyCodeAction(_prev: CodeState, formData: FormData): Promise<CodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!EMAIL.test(email)) return { step: "email", email, error: "Enter a valid email.", at: Date.now() };
  if (code.length !== 6) return { step: "code", email, error: "Enter the 6-digit code from the email.", at: Date.now() };

  const result = await consumeLoginCode(email, code);
  if (result !== "ok") {
    await slowDown();
    return { step: "code", email, error: CODE_ERRORS[result], at: Date.now() };
  }

  const user = await findOrCreateUser(email);
  await startSession(user.id, user.sessionKey);
  const next = safeReturnPath(formData.get("next"));
  redirect(user.created || !(await hasBrand(user.id)) ? `/welcome?next=${encodeURIComponent(next)}` : next);
}

export type WelcomeState = { error: string | null };

/** The welcome step for new accounts: their name and the first brand they invoice from. */
export async function welcomeAction(_prev: WelcomeState, formData: FormData): Promise<WelcomeState> {
  const user = await requireUser("/welcome");
  try {
    await setUpWorkspace(user.id, {
      name: v.optional(formData, "name", 120),
      brandName: v.required(formData, "brandName", "Brand name", 120),
      email: user.email,
    });
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
    throw error;
  }
  redirect(safeReturnPath(formData.get("next")));
}

export async function logout() {
  await endSession();
  redirect("/login");
}
