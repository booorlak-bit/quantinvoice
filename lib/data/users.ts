import "server-only";
import { sql } from "../db";
import type { Note, User } from "../types";

const userColumns = sql`id, email, name, avatar_url, theme, created_at::text as created_at`;

const STARTER_NOTES: Note[] = [
  {
    title: "Expenses",
    body: "The Client shall reimburse the Designer for all reasonable expenses incurred during this Project.",
  },
  { title: "Payment", body: "This invoice can be paid by card, bank transfer or crypto." },
];

const STARTER_TEMPLATES = [
  {
    name: "Website design",
    serviceType: "Web design",
    description: "Design and build of a marketing site.",
    style: "light",
    items: [
      { title: "Web design", description: "Screens", amount: "4000.00" },
      { title: "Web development", description: "Pages", amount: "8000.00" },
      { title: "CMS walkthrough", description: "Video tour", amount: null },
    ],
  },
  {
    name: "Brand identity",
    serviceType: "Branding",
    description: "Discovery, logo and brand guide.",
    style: "alt-light",
    items: [
      { title: "Discovery call", description: "Brand strategy", amount: null },
      { title: "Logo design", description: "1 logo", amount: "4000.00" },
      { title: "Brand guide", description: "Pages", amount: "2000.00" },
    ],
  },
  {
    name: "Product design sprint",
    serviceType: "Product design",
    description: "Wireframes, UI design and developer handoff.",
    style: "dark",
    items: [
      { title: "Wireframes", description: "Low-fidelity mockups", amount: "4000.00" },
      { title: "UI design", description: "High-fidelity screens", amount: "8000.00" },
      { title: "Developer handoff", description: "Assets for production", amount: null },
    ],
  },
  {
    name: "Monthly retainer",
    serviceType: "Retainer",
    description: "Fixed monthly scope of design and support.",
    style: "light",
    items: [
      { title: "Design retainer", description: "Monthly scope", amount: "3000.00" },
      { title: "Support", description: "Shared channel", amount: null },
    ],
  },
];

type SessionUser = User & { sessionKey: string };

/** Finds the account for a verified email, creating it on first sign-in. `created` tells new accounts apart. */
export async function findOrCreateUser(email: string) {
  const [row] = await sql<(SessionUser & { created: boolean })[]>`
    insert into users (email) values (${email})
    on conflict (email) do update set email = excluded.email
    returning ${userColumns}, session_key, (xmax = 0) as created
  `;
  return row;
}

/** Whether the account has finished the welcome step (it has at least one brand). */
export async function hasBrand(userId: string) {
  const [row] = await sql<{ exists: boolean }[]>`select exists (select 1 from companies where user_id = ${userId}) as exists`;
  return row.exists;
}

/** The welcome step: the person's name, their first brand and the starter templates. Safe to repeat. */
export async function setUpWorkspace(userId: string, input: { name: string | null; brandName: string; email: string }) {
  await sql.begin(async (tx) => {
    await tx`update users set name = coalesce(${input.name}, name) where id = ${userId}`;
    const [{ brands }] = await tx<{ brands: number }[]>`select count(*)::int as brands from companies where user_id = ${userId}`;
    if (brands === 0) {
      await tx`
        insert into companies (user_id, name, email, contact_email, invoice_prefix, default_notes, is_default)
        values (${userId}, ${input.brandName}, ${input.email}, ${input.email}, 'INV-', ${tx.json(STARTER_NOTES)}, true)
      `;
    }
    const [{ templates }] = await tx<{ templates: number }[]>`select count(*)::int as templates from templates where user_id = ${userId}`;
    if (templates === 0) {
      for (const template of STARTER_TEMPLATES) {
        await tx`
          insert into templates (user_id, name, service_type, description, style, items, notes)
          values (${userId}, ${template.name}, ${template.serviceType}, ${template.description}, ${template.style},
                  ${tx.json(template.items)}, ${tx.json(STARTER_NOTES)})
        `;
      }
    }
  });
}

export async function updateProfile(userId: string, input: { name: string | null; avatarUrl: string | null; theme: "light" | "dark" }) {
  await sql`update users set name = ${input.name}, avatar_url = ${input.avatarUrl}, theme = ${input.theme} where id = ${userId}`;
}

/** A new session key invalidates every session signed with the old one. Returns the new key. */
export async function rotateSessionKey(userId: string) {
  const [row] = await sql<{ sessionKey: string }[]>`
    update users set session_key = replace(gen_random_uuid()::text, '-', '') where id = ${userId} returning session_key
  `;
  return row.sessionKey;
}

export async function userExists(email: string) {
  const [row] = await sql<{ exists: boolean }[]>`select exists (select 1 from users where email = ${email}) as exists`;
  return row.exists;
}
