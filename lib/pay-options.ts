import "server-only";
import QRCode from "qrcode";
import type { PayOption } from "@/components/invoice/pay-dialog";
import { listInvoicePaymentMethods } from "./data/payment-methods";
import type { Invoice } from "./types";

async function qrDataUrl(value: string) {
  // Black on white with a quiet zone, whatever the page theme: wallets scan it reliably.
  const svg = await QRCode.toString(value, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** The ways to pay one invoice. A Stripe link set on the invoice wins over the Stripe method's own link. */
export async function getPayOptions(invoice: Pick<Invoice, "id" | "stripeLink"> & { userId: string }): Promise<PayOption[]> {
  const methods = await listInvoicePaymentMethods(invoice.userId, invoice.id);
  const options = await Promise.all(
    methods.map(async (method): Promise<PayOption> => {
      if (method.type === "stripe" && invoice.stripeLink) return { ...method, details: { url: invoice.stripeLink } };
      if (method.type === "crypto") return { ...method, qr: await qrDataUrl(method.details.address) };
      return method;
    }),
  );
  // Invoices from the first release carry a Stripe link without a payment method.
  if (invoice.stripeLink && !methods.some((method) => method.type === "stripe")) {
    options.unshift({ id: "stripe-link", name: "Card", type: "stripe", details: { url: invoice.stripeLink }, isDefault: false });
  }
  return options;
}
