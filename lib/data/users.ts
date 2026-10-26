import "server-only";
import type { TransactionSql } from "postgres";
import { sql } from "../db";
import { hashPassword, verifyPassword } from "../password";
import type { Note, User } from "../types";

type UserRow = User & { passwordHash: string };

const userColumns = sql`id, email, name, avatar_url, role, theme, created_at::text as created_at`;

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

export async function countUsers() {
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from users`;
  return count;
}

export async function findUserForLogin(email: string, password: string) {
  const [row] = await sql<UserRow[]>`
    select ${userColumns}, password_hash from users where email = ${email.trim().toLowerCase()}
  `;
  if (!row || !(await verifyPassword(password, row.passwordHash))) return null;
  return row;
}

type Tx = TransactionSql;

async function seedWorkspace(tx: Tx, userId: string, companyName: string, email: string) {
  const [{ count }] = await tx<{ count: number }[]>`select count(*)::int as count from companies where user_id = ${userId}`;
  if (count === 0) {
    await tx`
      insert into companies (user_id, name, email, contact_email, invoice_prefix, default_notes, is_default)
      values (${userId}, ${companyName}, ${email}, ${email}, 'INV-', ${tx.json(STARTER_NOTES)}, true)
    `;
  }
  for (const template of STARTER_TEMPLATES) {
    await tx`
      insert into templates (user_id, name, service_type, description, style, items, notes)
      values (${userId}, ${template.name}, ${template.serviceType}, ${template.description}, ${template.style},
              ${tx.json(template.items)}, ${tx.json(STARTER_NOTES)})
    `;
  }
}

/**
 * First sign-in on a fresh install: the account becomes the owner and claims every row created before accounts
 * existed. Guarded by a lock so two simultaneous first sign-ins cannot both become owner.
 */
export async function bootstrapOwner(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  return sql.begin(async (tx) => {
    await tx`lock table users in exclusive mode`;
    const [{ count }] = await tx<{ count: number }[]>`select count(*)::int as count from users`;
    if (count > 0) return null;

    const [user] = await tx<UserRow[]>`
      insert into users (email, password_hash, role) values (${email.trim().toLowerCase()}, ${passwordHash}, 'owner')
      returning ${userColumns}, password_hash
    `;
    for (const table of ["companies", "clients", "projects", "payment_methods", "templates", "invoices", "invoice_items", "payments", "invoice_events"]) {
      await tx`update ${tx(table)} set user_id = ${user.id} where user_id is null`;
    }
    await seedWorkspace(tx, user.id, "My company", user.email);
    return user;
  });
}

export async function createAccount(input: { email: string; name: string | null; password: string }) {
  const passwordHash = await hashPassword(input.password);
  return sql.begin(async (tx) => {
    const [user] = await tx<User[]>`
      insert into users (email, name, password_hash, role)
      values (${input.email.trim().toLowerCase()}, ${input.name}, ${passwordHash}, 'member')
      returning ${userColumns}
    `;
    await seedWorkspace(tx, user.id, input.name ? `${input.name}'s company` : "My company", user.email);
    return user;
  });
}

export async function listAccounts() {
  return sql<(User & { invoiceCount: number })[]>`
    select ${userColumns}, (select count(*)::int from invoices i where i.user_id = users.id) as invoice_count
    from users order by created_at
  `;
}

export async function deleteAccount(userId: string) {
  await sql`delete from users where id = ${userId} and role <> 'owner'`;
}

export async function updateProfile(userId: string, input: { name: string | null; email: string; avatarUrl: string | null; theme: "light" | "dark" }) {
  await sql`
    update users set name = ${input.name}, email = ${input.email.trim().toLowerCase()},
      avatar_url = ${input.avatarUrl}, theme = ${input.theme}
    where id = ${userId}
  `;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const [row] = await sql<{ passwordHash: string }[]>`select password_hash from users where id = ${userId}`;
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) return null;
  const passwordHash = await hashPassword(newPassword);
  await sql`update users set password_hash = ${passwordHash} where id = ${userId}`;
  return passwordHash;
}

export async function resetPassword(userId: string, newPassword: string) {
  await sql`update users set password_hash = ${await hashPassword(newPassword)} where id = ${userId} and role <> 'owner'`;
}
