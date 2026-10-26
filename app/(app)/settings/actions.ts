"use server";

import { revalidatePath } from "next/cache";
import { requireOwner, requireUser, startSession } from "@/lib/auth";
import { deleteCompany, saveCompany } from "@/lib/data/companies";
import { changePassword, createAccount, deleteAccount, resetPassword, updateProfile } from "@/lib/data/users";
import { passwordProblem } from "@/lib/password";
import * as v from "@/lib/validation";

export type SettingsState = { error: string | null; done?: number };

const ok = (): SettingsState => ({ error: null, done: Date.now() });

async function guard(run: () => Promise<void>): Promise<SettingsState> {
  try {
    await run();
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
    const constraint = v.uniqueViolation(error);
    if (constraint?.includes("email")) return { error: "Another account already uses this email." };
    throw error;
  }
  revalidatePath("/", "layout");
  return ok();
}

export async function saveCompanyAction(_prev: SettingsState, formData: FormData) {
  const user = await requireUser("/settings");
  return guard(async () => {
    const prefix = v.text(formData, "invoicePrefix");
    if (!/^[A-Za-z0-9._/-]{0,12}$/.test(prefix)) throw new v.ValidationError("Use up to 12 letters, digits, dots, dashes or slashes for the prefix.");
    await saveCompany(
      user.id,
      v.uuidOrNull(formData, "id"),
      {
        name: v.required(formData, "name", "Company name", 120),
        tagline: v.optional(formData, "tagline", 120),
        email: v.optionalEmail(formData, "email"),
        contactEmail: v.optionalEmail(formData, "contactEmail"),
        website: v.optionalUrl(formData, "website", "Website"),
        logoUrl: v.optionalUrl(formData, "logoUrl", "Logo URL"),
        address: v.optional(formData, "address", 500),
        taxId: v.optional(formData, "taxId", 60),
        invoicePrefix: prefix,
        defaultCurrency: v.currency(formData, "defaultCurrency"),
        defaultNotes: v.notes(formData),
      },
      formData.get("isDefault") === "on",
    );
  });
}

export async function deleteCompanyAction(id: string): Promise<SettingsState> {
  const user = await requireUser("/settings");
  const deleted = await deleteCompany(user.id, id);
  if (!deleted) return { error: "This company has invoices. Move or delete them first." };
  revalidatePath("/", "layout");
  return ok();
}

export async function updateProfileAction(_prev: SettingsState, formData: FormData) {
  const user = await requireUser("/settings");
  return guard(async () => {
    const email = v.optionalEmail(formData, "email");
    if (!email) throw new v.ValidationError("Email is required.");
    await updateProfile(user.id, {
      name: v.optional(formData, "name", 120),
      email,
      avatarUrl: v.optionalUrl(formData, "avatarUrl", "Avatar URL"),
      theme: v.text(formData, "theme") === "dark" ? "dark" : "light",
    });
  });
}

export async function changePasswordAction(_prev: SettingsState, formData: FormData) {
  const user = await requireUser("/settings");
  return guard(async () => {
    const next = String(formData.get("newPassword") ?? "");
    if (next !== String(formData.get("confirmPassword") ?? "")) throw new v.ValidationError("The new passwords don’t match.");
    const problem = passwordProblem(next);
    if (problem) throw new v.ValidationError(problem);
    const hash = await changePassword(user.id, String(formData.get("currentPassword") ?? ""), next);
    if (!hash) throw new v.ValidationError("The current password is wrong.");
    // Other devices are signed out by the new hash; keep this one signed in.
    await startSession(user.id, hash);
  });
}

export async function createAccountAction(_prev: SettingsState, formData: FormData) {
  await requireOwner("/settings");
  return guard(async () => {
    const email = v.optionalEmail(formData, "email");
    if (!email) throw new v.ValidationError("Email is required.");
    const password = String(formData.get("password") ?? "");
    const problem = passwordProblem(password);
    if (problem) throw new v.ValidationError(problem);
    await createAccount({ email, name: v.optional(formData, "name", 120), password });
  });
}

export async function resetPasswordAction(_prev: SettingsState, formData: FormData) {
  await requireOwner("/settings");
  return guard(async () => {
    const id = v.uuidOrNull(formData, "id");
    if (!id) throw new v.ValidationError("Account not found.");
    const password = String(formData.get("password") ?? "");
    const problem = passwordProblem(password);
    if (problem) throw new v.ValidationError(problem);
    await resetPassword(id, password);
  });
}

export async function deleteAccountAction(id: string): Promise<SettingsState> {
  const owner = await requireOwner("/settings");
  if (id === owner.id) return { error: "You can’t delete your own account." };
  await deleteAccount(id);
  revalidatePath("/", "layout");
  return ok();
}
