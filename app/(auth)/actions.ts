"use server";

import { redirect } from "next/navigation";
import { authConfigError, endSession, safeReturnPath, startSession } from "@/lib/auth";
import { bootstrapOwner, countUsers, findUserForLogin } from "@/lib/data/users";

export type LoginState = { error: string | null };

const slowDown = () => new Promise((resolve) => setTimeout(resolve, 800));

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const configError = authConfigError();
  if (configError) return { error: configError };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };

  if ((await countUsers()) === 0) {
    // First sign-in: ADMIN_PASSWORD from the server environment proves this is the site's owner.
    const setupPassword = process.env.ADMIN_PASSWORD;
    if (!setupPassword || password !== setupPassword) {
      await slowDown();
      return { error: "Wrong password. On the first sign-in use the ADMIN_PASSWORD set on the server." };
    }
    const owner = await bootstrapOwner(email, password);
    if (!owner) return { error: "The owner account was just created. Sign in again." };
    await startSession(owner.id, owner.passwordHash);
  } else {
    const user = await findUserForLogin(email, password);
    if (!user) {
      await slowDown();
      return { error: "Wrong email or password." };
    }
    await startSession(user.id, user.passwordHash);
  }

  redirect(safeReturnPath(formData.get("next")));
}

export async function logout() {
  await endSession();
  redirect("/login");
}
