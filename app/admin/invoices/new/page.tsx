import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/AdminPage";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { requireAdmin } from "@/lib/auth";
import { getBusiness, suggestInvoiceNumber } from "@/lib/data";

export const metadata: Metadata = { title: "New Invoice" };

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export default async function NewInvoicePage() {
  await requireAdmin("/admin/invoices/new");
  const [business, number] = await Promise.all([getBusiness(), suggestInvoiceNumber()]);
  const today = new Date();

  return (
    <AdminPage title="New Invoice" back={{ href: "/", label: "Invoices" }}>
      <InvoiceForm
        initial={{
          number,
          slug: "",
          title: "",
          status: "draft",
          clientName: "",
          clientEmail: "",
          issueDate: isoDate(today),
          dueDate: isoDate(new Date(today.getTime() + 15 * DAY_MS)),
          currency: business.defaultCurrency,
          taxNote: "Calculated at Checkout",
          paymentUrl: "",
          paymentLabel: "Pay with Stripe",
          notes: business.defaultNotes,
          items: [],
        }}
      />
    </AdminPage>
  );
}
