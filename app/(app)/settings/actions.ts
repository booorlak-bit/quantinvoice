"use server";

import { revalidatePath } from "next/cache";
import { requireUser, startSession } from "@/lib/auth";
import { deleteCompany, saveCompany } from "@/lib/data/companies";
import { rotateSessionKey, updateProfile } from "@/lib/data/users";
import { senderProblem, sendingDomain } from "@/lib/email";
import * as v from "@/lib/validation";

export type SettingsState = { error: string | null; done?: number };

const ok = (): SettingsState => ({ error: null, done: Date.now() });

async function guard(run: () => Promise<void>): Promise<SettingsState> {
  try {
    await run();
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
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
    const sender = parseSender(v.text(formData, "sender"));
    const input = {
      name: v.required(formData, "name", "Brand name", 120),
      tagline: v.optional(formData, "tagline", 120),
      email: v.optionalEmail(formData, "email"),
      contactEmail: v.optionalEmail(formData, "contactEmail"),
      website: v.optionalUrl(formData, "website", "Website"),
      logoUrl: v.optionalUrl(formData, "logoUrl", "Logo URL"),
      address: v.optional(formData, "address", 500),
      taxId: v.optional(formData, "taxId", 60),
      invoicePrefix: prefix,
      sender,
      defaultCurrency: v.currency(formData, "defaultCurrency"),
      defaultNotes: v.notes(formData),
    };
    try {
      await saveCompany(user.id, v.uuidOrNull(formData, "id"), input, formData.get("isDefault") === "on");
    } catch (error) {
      if (v.uniqueViolation(error)?.includes("sender")) throw new v.ValidationError(`${sender}@${sendingDomain()} is taken. Pick another name.`);
      throw error;
    }
  });
}

/** The part before the @ that the brand's emails come from; the full address on our domain is accepted too. */
function parseSender(raw: string) {
  const domain = sendingDomain();
  let sender = raw.toLowerCase();
  if (domain && sender.endsWith(`@${domain}`)) sender = sender.slice(0, -domain.length - 1);
  if (!sender) return null;
  if (sender.includes("@")) throw new v.ValidationError(`Only the part before the @: emails go from @${domain ?? "the sending domain"}.`);
  const problem = senderProblem(sender);
  if (problem) throw new v.ValidationError(problem);
  return sender;
}

export async function deleteCompanyAction(id: string): Promise<SettingsState> {
  const user = await requireUser("/settings");
  const deleted = await deleteCompany(user.id, id);
  if (!deleted) return { error: "This brand has invoices. Move or delete them first." };
  revalidatePath("/", "layout");
  return ok();
}

export async function updateProfileAction(_prev: SettingsState, formData: FormData) {
  const user = await requireUser("/settings");
  return guard(async () => {
    await updateProfile(user.id, {
      name: v.optional(formData, "name", 120),
      avatarUrl: v.optionalUrl(formData, "avatarUrl", "Avatar URL"),
      theme: v.text(formData, "theme") === "dark" ? "dark" : "light",
    });
  });
}

/** Signs the account out on every other device; this one gets a fresh session. */
export async function signOutOtherDevicesAction(): Promise<SettingsState> {
  const user = await requireUser("/settings");
  await startSession(user.id, await rotateSessionKey(user.id));
  return ok();
}
