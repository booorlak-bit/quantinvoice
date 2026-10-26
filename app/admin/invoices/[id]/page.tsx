import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { requireAdmin } from "@/lib/auth";
import { getInvoiceById } from "@/lib/data";

export const metadata: Metadata = { title: "Edit Invoice" };

export default async function EditInvoicePage({ params }: PageProps<"/admin/invoices/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/invoices/${id}`);
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  return (
    <AdminPage title={`Edit ${invoice.number}`} back={{ href: `/invoices/${invoice.slug}`, label: invoice.title }}>
      <InvoiceForm
        initial={{
          ...invoice,
          clientEmail: invoice.clientEmail ?? "",
          dueDate: invoice.dueDate ?? "",
          paymentUrl: invoice.paymentUrl ?? "",
          items: invoice.items.map((item) => ({
            title: item.title,
            description: item.description ?? "",
            amount: item.amount ?? "",
          })),
        }}
      />
    </AdminPage>
  );
}
