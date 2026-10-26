import { getCurrentUser } from "@/lib/auth";
import { getPublicInvoice } from "@/lib/data/invoices";
import { getPayOptions } from "@/lib/pay-options";
import { pdfFileName, renderInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { siteUrl } from "@/lib/site-url";

/** The client's copy of the invoice as a PDF. Same visibility as the invoice page: drafts only for their owner. */
export async function GET(_request: Request, { params }: RouteContext<"/i/[slug]/pdf">) {
  const { slug } = await params;
  const [invoice, viewer] = await Promise.all([getPublicInvoice(slug), getCurrentUser()]);
  if (!invoice || (invoice.status === "draft" && viewer?.id !== invoice.userId)) return new Response("Not found", { status: 404 });

  const options = invoice.status === "paid" ? [] : await getPayOptions(invoice);
  const pdf = await renderInvoicePdf(invoice, options, `${await siteUrl()}/i/${invoice.slug}`);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(invoice)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
