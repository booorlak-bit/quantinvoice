import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { sql } from "./db";
import type { User } from "./types";

const COOKIE_NAME = "qi_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Describes what is missing from the server's auth configuration, or null when it is complete. */
export function authConfigError() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return "SESSION_SECRET must be set on the server and be at least 32 characters long.";
  }
  return null;
}

// The key mixes in the user's session key, so rotating it signs that user out everywhere.
function sign(value: string, sessionKey: string) {
  const error = authConfigError();
  if (error) throw new Error(error);
  return createHmac("sha256", `${process.env.SESSION_SECRET}:${sessionKey}`).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function startSession(userId: string, sessionKey: string) {
  const payload = `${userId}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload, sessionKey)}`, {
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

/** The signed-in user, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // A session is checked against the clock, so it waits for the request rather than prerendering.
  await connection();
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value || authConfigError()) return null;
  const [userId, expires, signature] = value.split(".");
  if (!userId || !expires || !signature || Number(expires) < Date.now()) return null;
  if (!/^[0-9a-f-]{36}$/.test(userId)) return null;

  const [row] = await sql<(User & { sessionKey: string })[]>`
    select id, email, name, avatar_url, theme, created_at::text as created_at, session_key
    from users where id = ${userId}
  `;
  if (!row || !safeEqual(signature, sign(`${userId}.${expires}`, row.sessionKey))) return null;
  return { id: row.id, email: row.email, name: row.name, avatarUrl: row.avatarUrl, theme: row.theme, createdAt: row.createdAt };
});

export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Same-site relative paths only, to avoid open redirects. */
export function safeReturnPath(value: unknown, fallback = "/dashboard") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
