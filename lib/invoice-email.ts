import "server-only";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/**
 * The email that carries an invoice: the sender's message, a summary and, when chosen, a button to the invoice page.
 * Inline styles and literal colours only, because email clients ignore stylesheets (OSDS light neutrals and blue-600).
 */
export function invoiceEmail(input: {
  companyName: string;
  message: string;
  number: string;
  title: string;
  amount: string;
  dueDate: string;
  pageUrl: string | null;
  hasPdf: boolean;
}) {
  const paragraphs = input.message
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px">${escape(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const button = input.pageUrl
    ? `<p style="margin:24px 0"><a href="${escape(input.pageUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px">View and pay invoice</a></p>`
    : "";
  const attachment = input.hasPdf ? `<p style="margin:0;color:#737373;font-size:13px">The invoice is attached as a PDF.</p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;color:#171717;font-size:15px;line-height:1.5">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:14px;padding:28px">
<p style="margin:0 0 20px;font-weight:600">${escape(input.companyName)}</p>
${paragraphs}
<table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0 0;font-size:14px">
<tr><td style="padding:8px 0;border-top:1px solid #e5e5e5;color:#737373">Invoice</td><td style="padding:8px 0;border-top:1px solid #e5e5e5;text-align:right">${escape(input.number)} · ${escape(input.title)}</td></tr>
<tr><td style="padding:8px 0;border-top:1px solid #e5e5e5;color:#737373">Amount due</td><td style="padding:8px 0;border-top:1px solid #e5e5e5;text-align:right;font-weight:600">${escape(input.amount)}</td></tr>
<tr><td style="padding:8px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#737373">Due</td><td style="padding:8px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;text-align:right">${escape(input.dueDate)}</td></tr>
</table>
${button}${attachment}
</div></body></html>`;
  const text = [
    input.message,
    "",
    `Invoice ${input.number} · ${input.title}`,
    `Amount due: ${input.amount}`,
    `Due: ${input.dueDate}`,
    input.pageUrl ? `\nView and pay: ${input.pageUrl}` : "",
    input.hasPdf ? "\nThe invoice is attached as a PDF." : "",
  ].join("\n");
  return { html, text };
}
