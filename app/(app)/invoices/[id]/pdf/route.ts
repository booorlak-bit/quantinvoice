import { getCurrentUser } from "@/lib/auth";
import { getInvoice } from "@/lib/data/invoices";
import { getPayOptions } from "@/lib/pay-options";
import { pdfFileName, renderInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { siteUrl } from "@/lib/site-url";

/** The invoice as a PDF, for its owner (any status, drafts included). */
export async function GET(request: Request, { params }: RouteContext<"/invoices/[id]/pdf">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return Response.redirect(new URL(`/login?next=${encodeURIComponent(`/invoices/${id}`)}`, request.url), 303);
  const invoice = await getInvoice(user.id, id);
  if (!invoice) return new Response("Not found", { status: 404 });

  const options = await getPayOptions({ ...invoice, userId: user.id });
  const pdf = await renderInvoicePdf(invoice, options, `${await siteUrl()}/i/${invoice.slug}`);
  const download = new URL(request.url).searchParams.get("download") !== "0";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${pdfFileName(invoice)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
