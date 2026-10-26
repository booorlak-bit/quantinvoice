import "server-only";
import { sql } from "../db";
import type { PaymentMethod } from "../types";

const columns = sql`id, name, type, details, is_default`;

export async function listPaymentMethods(userId: string) {
  return sql<PaymentMethod[]>`
    select ${columns} from payment_methods where user_id = ${userId} order by position, created_at
  `;
}

/** The methods offered on one invoice, in the owner's order. */
export async function listInvoicePaymentMethods(userId: string, invoiceId: string) {
  return sql<PaymentMethod[]>`
    select ${columns} from payment_methods m
    where m.user_id = ${userId}
      and exists (select 1 from invoice_payment_methods ipm where ipm.invoice_id = ${invoiceId} and ipm.method_id = m.id)
    order by m.position, m.created_at
  `;
}

export type PaymentMethodInput = Pick<PaymentMethod, "name" | "type" | "details" | "isDefault">;

export async function savePaymentMethod(userId: string, id: string | null, input: PaymentMethodInput) {
  if (id) {
    // The type of an existing method doesn't change: its details only make sense for that type.
    const [updated] = await sql<{ id: string }[]>`
      update payment_methods
      set name = ${input.name}, details = ${sql.json(input.details)}, is_default = ${input.isDefault}
      where id = ${id} and user_id = ${userId} and type = ${input.type}
      returning id
    `;
    return updated?.id ?? null;
  }
  const [created] = await sql<{ id: string }[]>`
    insert into payment_methods (user_id, name, type, details, is_default, position)
    values (${userId}, ${input.name}, ${input.type}, ${sql.json(input.details)}, ${input.isDefault},
      coalesce((select max(position) + 1 from payment_methods where user_id = ${userId}), 0))
    returning id
  `;
  return created.id;
}

export async function deletePaymentMethod(userId: string, id: string) {
  await sql`delete from payment_methods where id = ${id} and user_id = ${userId}`;
}
