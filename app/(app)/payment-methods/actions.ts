"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { deletePaymentMethod, savePaymentMethod, type PaymentMethodInput } from "@/lib/data/payment-methods";
import { PAYMENT_METHOD_TYPES, type PaymentMethodType } from "@/lib/types";
import * as v from "@/lib/validation";

export type MethodFormState = { error: string | null; done?: number };

function requiredUrl(formData: FormData, key: string, label: string) {
  const url = v.optionalUrl(formData, key, label);
  if (!url) throw new v.ValidationError(`${label} is required.`);
  return url;
}

function parseMethod(formData: FormData): PaymentMethodInput {
  const type = v.text(formData, "type") as PaymentMethodType;
  if (!PAYMENT_METHOD_TYPES.includes(type)) throw new v.ValidationError("Choose a kind of payment method.");
  const name = v.required(formData, "name", "Name", 60);
  const isDefault = formData.get("isDefault") === "on";

  switch (type) {
    case "stripe":
      return { name, type, isDefault, details: { url: requiredUrl(formData, "url", "Payment link") } };
    case "crypto": {
      const address = v.required(formData, "address", "Wallet address", 200);
      if (/\s/.test(address)) throw new v.ValidationError("The wallet address can’t contain spaces.");
      return {
        name,
        type,
        isDefault,
        details: {
          asset: v.required(formData, "asset", "Coin", 12).toUpperCase(),
          network: v.required(formData, "network", "Network", 40),
          address,
          memo: v.optional(formData, "memo", 100),
        },
      };
    }
    case "bank": {
      const iban = v.optional(formData, "iban", 50)?.replace(/\s+/g, "").toUpperCase() ?? null;
      const accountNumber = v.optional(formData, "accountNumber", 50);
      if (!iban && !accountNumber) throw new v.ValidationError("Add an IBAN or an account number.");
      return {
        name,
        type,
        isDefault,
        details: {
          accountHolder: v.required(formData, "accountHolder", "Account holder", 120),
          bankName: v.optional(formData, "bankName", 120),
          iban,
          accountNumber,
          swift: v.optional(formData, "swift", 20)?.replace(/\s+/g, "").toUpperCase() ?? null,
          routingNumber: v.optional(formData, "routingNumber", 40),
          bankAddress: v.optional(formData, "bankAddress", 300),
          reference: v.optional(formData, "reference", 200),
        },
      };
    }
    case "link":
      return {
        name,
        type,
        isDefault,
        details: { url: requiredUrl(formData, "url", "Link"), label: v.text(formData, "label").slice(0, 40) || "Pay now" },
      };
  }
}

export async function saveMethodAction(_prev: MethodFormState, formData: FormData): Promise<MethodFormState> {
  const user = await requireUser("/payment-methods");
  try {
    const saved = await savePaymentMethod(user.id, v.uuidOrNull(formData, "id"), parseMethod(formData));
    if (!saved) return { error: "This payment method no longer exists." };
  } catch (error) {
    if (error instanceof v.ValidationError) return { error: error.message };
    throw error;
  }
  revalidatePath("/payment-methods");
  return { error: null, done: Date.now() };
}

export async function deleteMethodAction(id: string) {
  const user = await requireUser("/payment-methods");
  await deletePaymentMethod(user.id, id);
  revalidatePath("/payment-methods");
}
