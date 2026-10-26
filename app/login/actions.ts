"use server";

import { redirect } from "next/navigation";
import { authConfigError, isValidPassword, startSession } from "@/lib/auth";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const configError = authConfigError();
  if (configError) return { error: configError };

  const password = formData.get("password");
  if (typeof password !== "string" || !isValidPassword(password)) {
    // Slow down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Wrong password." };
  }
  await startSession();

  // Only allow same-site relative paths to avoid open redirects.
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
