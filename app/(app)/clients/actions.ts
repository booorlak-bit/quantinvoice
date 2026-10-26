"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient, deleteClient, deleteProject, ensureProject, renameProject, updateClient, type ClientInput } from "@/lib/data/clients";
import * as v from "@/lib/validation";

export type ClientFormState = { error: string | null; done?: number; client?: { id: string; name: string; company: string | null; email: string | null; projects: [] } };

function parseClient(formData: FormData): ClientInput {
  return {
    name: v.required(formData, "name", "Name", 120),
    company: v.optional(formData, "company", 120),
    email: v.optionalEmail(formData, "email"),
    phone: v.optional(formData, "phone", 60),
    address: v.optional(formData, "address", 500),
    website: v.optionalUrl(formData, "website", "Website"),
    notes: v.optional(formData, "notes", 2000),
  };
}

/** Creates a client and returns it, for the inline "New client" dialog in the invoice form. */
export async function createClientAction(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const user = await requireUser("/clients");
  try {
    const input = parseClient(formData);
    const id = await createClient(user.id, input);
    revalidatePath("/clients");
    return { error: null, client: { id, name: input.name, company: input.company, email: input.email, projects: [] } };
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
    throw error;
  }
}

export async function updateClientAction(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const id = v.uuidOrNull(formData, "id");
  const user = await requireUser(id ? `/clients/${id}` : "/clients");
  if (!id) return { error: "Client not found." };
  try {
    await updateClient(user.id, id, parseClient(formData));
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { error: null, done: Date.now() };
}

export async function deleteClientAction(id: string) {
  const user = await requireUser(`/clients/${id}`);
  const deleted = await deleteClient(user.id, id);
  if (!deleted) return { error: "This client has invoices. Delete or reassign them first." };
  revalidatePath("/", "layout");
  redirect("/clients");
}

export async function addProjectAction(clientId: string, name: string) {
  const user = await requireUser(`/clients/${clientId}`);
  const trimmed = name.trim().slice(0, 120);
  if (!trimmed) return { error: "Enter a project name." };
  await ensureProject(user.id, clientId, trimmed);
  revalidatePath("/", "layout");
  return { error: null };
}

export async function renameProjectAction(projectId: string, name: string) {
  const user = await requireUser("/clients");
  const trimmed = name.trim().slice(0, 120);
  if (!trimmed) return { error: "Enter a project name." };
  await renameProject(user.id, projectId, trimmed);
  revalidatePath("/", "layout");
  return { error: null };
}

export async function deleteProjectAction(projectId: string) {
  const user = await requireUser("/clients");
  await deleteProject(user.id, projectId);
  revalidatePath("/", "layout");
}
