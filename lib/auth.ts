import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "qi_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Describes what is missing from the server's auth configuration, or null when it is complete. */
export function authConfigError() {
  if (!process.env.ADMIN_PASSWORD) return "ADMIN_PASSWORD is not set on the server.";
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return "SESSION_SECRET must be set on the server and be at least 32 characters long.";
  }
  return null;
}

// Signing with the admin password as part of the key means that changing
// ADMIN_PASSWORD signs every existing session out.
function signingKey() {
  const error = authConfigError();
  if (error) throw new Error(error);
  return `${process.env.SESSION_SECRET}:${process.env.ADMIN_PASSWORD}`;
}

function sign(value: string) {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = createHmac("sha256", "compare").update(a).digest();
  const right = createHmac("sha256", "compare").update(b).digest();
  return timingSafeEqual(left, right);
}

export function isValidPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && safeEqual(password, expected!);
}

export async function startSession() {
  const expires = String(Date.now() + MAX_AGE_SECONDS * 1000);
  (await cookies()).set(COOKIE_NAME, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAdmin() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, sign(expires));
}

export async function requireAdmin(returnTo: string) {
  if (!(await isAdmin())) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
}
