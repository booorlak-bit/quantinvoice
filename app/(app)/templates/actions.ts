"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { deleteTemplate, getTemplate, saveTemplate } from "@/lib/data/templates";
import { INVOICE_STYLES, type InvoiceStyle } from "@/lib/types";
import * as v from "@/lib/validation";

export type TemplateFormState = { error: string | null };

export async function saveTemplateAction(_prev: TemplateFormState, formData: FormData): Promise<TemplateFormState> {
  const user = await requireUser("/templates");
  try {
    const style = v.text(formData, "style") as InvoiceStyle;
    if (!INVOICE_STYLES.includes(style)) throw new v.ValidationError("Choose a style.");
    const currency = v.text(formData, "currency") ? v.currency(formData, "currency") : null;
    const items = v.items(formData);
    if (items.length === 0) throw new v.ValidationError("Add at least one line item.");
    await saveTemplate(user.id, v.uuidOrNull(formData, "id"), {
      name: v.required(formData, "name", "Template name", 80),
      serviceType: v.optional(formData, "serviceType", 60),
      description: v.optional(formData, "description", 300),
      style,
      currency,
      items,
      notes: v.notes(formData),
    });
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
    throw error;
  }
  revalidatePath("/templates");
  redirect("/templates");
}

export async function duplicateTemplateAction(id: string) {
  const user = await requireUser("/templates");
  const template = await getTemplate(user.id, id);
  if (!template) return;
  await saveTemplate(user.id, null, { ...template, name: `${template.name} copy`.slice(0, 80) });
  revalidatePath("/templates");
}

export async function deleteTemplateAction(id: string) {
  const user = await requireUser("/templates");
  await deleteTemplate(user.id, id);
  revalidatePath("/templates");
}
