import "server-only";
import { sql } from "../db";
import type { Company } from "../types";

const companyColumns = sql`
  id, name, email, contact_email, tagline, logo_url, address, tax_id, website, sender,
  invoice_prefix, default_currency, default_notes, is_default
`;

export async function listCompanies(userId: string) {
  return sql<Company[]>`
    select ${companyColumns} from companies where user_id = ${userId} order by is_default desc, name
  `;
}

export async function getCompany(userId: string, id: string) {
  const [row] = await sql<Company[]>`select ${companyColumns} from companies where user_id = ${userId} and id = ${id}`;
  return row ?? null;
}

export async function getDefaultCompany(userId: string) {
  const [row] = await sql<Company[]>`
    select ${companyColumns} from companies where user_id = ${userId} order by is_default desc, created_at limit 1
  `;
  return row ?? null;
}

export type CompanyInput = Omit<Company, "id" | "isDefault">;

export async function saveCompany(userId: string, id: string | null, input: CompanyInput, makeDefault: boolean) {
  return sql.begin(async (tx) => {
    const row = {
      name: input.name,
      email: input.email,
      contactEmail: input.contactEmail,
      tagline: input.tagline,
      logoUrl: input.logoUrl,
      address: input.address,
      taxId: input.taxId,
      website: input.website,
      sender: input.sender,
      invoicePrefix: input.invoicePrefix,
      defaultCurrency: input.defaultCurrency,
      defaultNotes: tx.json(input.defaultNotes),
    };
    let companyId = id;
    if (companyId) {
      await tx`update companies set ${tx(row)} where id = ${companyId} and user_id = ${userId}`;
    } else {
      const [{ count }] = await tx<{ count: number }[]>`select count(*)::int as count from companies where user_id = ${userId}`;
      const [created] = await tx<{ id: string }[]>`
        insert into companies ${tx({ ...row, userId, isDefault: count === 0 })} returning id
      `;
      companyId = created.id;
    }
    if (makeDefault) {
      await tx`update companies set is_default = false where user_id = ${userId} and id <> ${companyId}`;
      await tx`update companies set is_default = true where user_id = ${userId} and id = ${companyId}`;
    }
    return companyId;
  });
}

/** Deletes a company that has no invoices. Returns false when invoices still use it. */
export async function deleteCompany(userId: string, id: string) {
  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count from invoices where user_id = ${userId} and company_id = ${id}
  `;
  if (count > 0) return false;
  await sql.begin(async (tx) => {
    await tx`delete from companies where user_id = ${userId} and id = ${id}`;
    await tx`
      update companies set is_default = true
      where id = (select id from companies where user_id = ${userId} order by created_at limit 1)
        and not exists (select 1 from companies where user_id = ${userId} and is_default)
    `;
  });
  return true;
}
