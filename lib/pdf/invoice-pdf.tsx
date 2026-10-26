import "server-only";
import path from "node:path";
import { Document, Font, Image, Link, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PayOption } from "@/components/invoice/pay-dialog";
import { formatDate, formatMoney, sumItems } from "../format";
import type { Invoice } from "../types";

// Inter from Google Fonts (SIL OFL, see fonts/OFL.txt): Latin and Cyrillic in one file each.
const fonts = path.join(process.cwd(), "lib/pdf/fonts");
Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(fonts, "Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fonts, "Inter-Medium.ttf"), fontWeight: 500 },
    { src: path.join(fonts, "Inter-SemiBold.ttf"), fontWeight: 600 },
  ],
});
// Keep words whole; the default splits them with hyphens.
Font.registerHyphenationCallback((word) => [word]);

// A PDF has no design tokens: these are the OSDS light neutrals (neutral-900 / 500 / 200, white) written out.
const ink = "#171717";
const muted = "#737373";
const line = "#e5e5e5";

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9.5, color: ink, paddingTop: 48, paddingBottom: 64, paddingHorizontal: 48, lineHeight: 1.4 },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 8 },
  logoTile: { width: 36, height: 36, borderRadius: 8, backgroundColor: ink, color: "#ffffff", fontSize: 15, fontWeight: 600, textAlign: "center", paddingTop: 8 },
  companyName: { fontSize: 11, fontWeight: 600 },
  muted: { color: muted },
  label: { fontSize: 8, color: muted, marginBottom: 3 },
  title: { fontSize: 24, fontWeight: 600, letterSpacing: -0.5, marginBottom: 22, lineHeight: 1.15 },
  meta: { flexDirection: "row", gap: 16, marginBottom: 24 },
  metaCell: { flex: 1 },
  strong: { fontWeight: 500 },
  stamp: { marginTop: 6, alignSelf: "flex-end", borderWidth: 1, borderColor: ink, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 8, fontWeight: 600 },
  tableHead: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: line, paddingBottom: 6 },
  item: { flexDirection: "row", justifyContent: "space-between", gap: 24, borderBottomWidth: 1, borderBottomColor: line, paddingVertical: 9 },
  totals: { marginTop: 14, marginLeft: "auto", width: 230, gap: 5 },
  total: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, borderTopColor: line, paddingTop: 8, marginTop: 3, marginBottom: 4 },
  totalValue: { fontSize: 16, fontWeight: 600 },
  section: { marginTop: 26, borderTopWidth: 1, borderTopColor: line, paddingTop: 14 },
  sectionTitle: { fontSize: 10, fontWeight: 600, marginBottom: 8 },
  notes: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  note: { width: "47%" },
  method: { marginBottom: 10 },
  detail: { flexDirection: "row", gap: 8 },
  detailLabel: { width: 110, color: muted },
  mono: { fontFamily: "Courier", fontSize: 9 },
  link: { color: ink, textDecoration: "underline" },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: muted },
});

function Detail({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <View style={s.detail}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={mono ? s.mono : undefined}>{value}</Text>
    </View>
  );
}

function MethodBlock({ option, invoiceNumber }: { option: PayOption; invoiceNumber: string }) {
  return (
    <View style={s.method} wrap={false}>
      <Text style={[s.strong, { marginBottom: 3 }]}>{option.name}</Text>
      {option.type === "stripe" && (
        <Link src={option.details.url} style={s.link}>
          Pay by card online
        </Link>
      )}
      {option.type === "link" && (
        <Link src={option.details.url} style={s.link}>
          {option.details.label}: {option.details.url}
        </Link>
      )}
      {option.type === "crypto" && (
        <>
          <Detail label="Coin" value={`${option.details.asset} on ${option.details.network}`} />
          <Detail label="Address" value={option.details.address} mono />
          <Detail label="Memo" value={option.details.memo} mono />
        </>
      )}
      {option.type === "bank" && (
        <>
          <Detail label="Account holder" value={option.details.accountHolder} />
          <Detail label="Bank" value={option.details.bankName} />
          <Detail label="IBAN" value={option.details.iban} mono />
          <Detail label="Account number" value={option.details.accountNumber} mono />
          <Detail label="SWIFT / BIC" value={option.details.swift} mono />
          <Detail label="Routing or sort code" value={option.details.routingNumber} mono />
          <Detail label="Bank address" value={option.details.bankAddress} />
          <Detail label="Reference" value={option.details.reference || invoiceNumber} />
        </>
      )}
    </View>
  );
}

function InvoicePdf({ invoice, options, pageUrl, logo }: { invoice: Invoice; options: PayOption[]; pageUrl: string; logo: Buffer | null }) {
  const total = sumItems(invoice.items);
  const paid = Number(invoice.paidTotal);
  const balance = Math.max(Number(total) - paid, 0);
  const { company, client } = invoice;
  const money = (value: string | number) => formatMoney(value, invoice.currency);

  return (
    <Document title={`${invoice.number} · ${invoice.title}`} author={company.name} creator="Quantinvoice" producer="Quantinvoice">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            {/* react-pdf images have no alt text; the company name sits right next to it. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logo ? <Image src={logo} style={s.logo} /> : <Text style={s.logoTile}>{company.name.charAt(0).toUpperCase()}</Text>}
            <View>
              <Text style={s.companyName}>{company.name}</Text>
              {company.tagline && <Text style={s.muted}>{company.tagline}</Text>}
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text>
              <Text style={s.muted}>Invoice </Text>
              <Text style={s.strong}>{invoice.number}</Text>
            </Text>
            {invoice.status === "paid" && <Text style={s.stamp}>PAID</Text>}
          </View>
        </View>

        <Text style={s.title}>{invoice.title}</Text>

        <View style={s.meta}>
          <View style={s.metaCell}>
            <Text style={s.label}>Issued</Text>
            <Text>{formatDate(invoice.issueDate)}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.label}>Due</Text>
            <Text>{formatDate(invoice.dueDate)}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.label}>Bill to</Text>
            <Text style={s.strong}>{client.company ?? client.name}</Text>
            {client.company && <Text style={s.muted}>{client.name}</Text>}
            {client.email && <Text style={s.muted}>{client.email}</Text>}
            {client.address && <Text style={s.muted}>{client.address}</Text>}
          </View>
          <View style={s.metaCell}>
            <Text style={s.label}>From</Text>
            <Text style={s.strong}>{company.name}</Text>
            {company.email && <Text style={s.muted}>{company.email}</Text>}
            {company.address && <Text style={s.muted}>{company.address}</Text>}
            {company.taxId && <Text style={s.muted}>Tax ID {company.taxId}</Text>}
          </View>
        </View>

        {invoice.project && (
          <View style={{ marginBottom: 20 }}>
            <Text style={s.label}>Project</Text>
            <Text>{invoice.project.name}</Text>
          </View>
        )}

        <View style={s.tableHead}>
          <Text style={s.label}>Item</Text>
          <Text style={s.label}>Amount</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={index} style={s.item} wrap={false}>
            <View style={{ flex: 1 }}>
              <Text style={s.strong}>{item.title}</Text>
              {item.description && <Text style={s.muted}>{item.description}</Text>}
            </View>
            <Text style={item.amount === null ? s.muted : undefined}>{item.amount === null ? "Included" : money(item.amount)}</Text>
          </View>
        ))}

        <View style={s.totals} wrap={false}>
          <View style={s.between}>
            <Text style={s.muted}>Subtotal</Text>
            <Text>{money(total)}</Text>
          </View>
          <View style={s.between}>
            <Text style={s.muted}>Tax</Text>
            <Text>{invoice.taxNote}</Text>
          </View>
          <View style={s.total}>
            <Text style={s.strong}>Total {invoice.currency}</Text>
            <Text style={s.totalValue}>{money(total)}</Text>
          </View>
          {paid > 0 && (
            <>
              <View style={s.between}>
                <Text style={s.muted}>Paid</Text>
                <Text>−{money(paid)}</Text>
              </View>
              <View style={s.between}>
                <Text style={s.strong}>Balance due</Text>
                <Text style={s.strong}>{money(balance)}</Text>
              </View>
            </>
          )}
        </View>

        {invoice.notes.length > 0 && (
          <View style={[s.section, s.notes]}>
            {invoice.notes.map((note, index) => (
              <View key={index} style={s.note} wrap={false}>
                <Text style={[s.strong, { marginBottom: 3 }]}>{note.title}</Text>
                <Text style={s.muted}>{note.body}</Text>
              </View>
            ))}
          </View>
        )}

        {invoice.status !== "paid" && (options.length > 0 || pageUrl) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>How to pay</Text>
            {options.map((option) => (
              <MethodBlock key={option.id} option={option} invoiceNumber={invoice.number} />
            ))}
            <Text style={s.muted}>
              View and pay online:{" "}
              <Link src={pageUrl} style={s.link}>
                {pageUrl}
              </Link>
            </Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>
            {company.name} · {invoice.number}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Fetches a PNG or JPEG logo for the PDF; anything else (or a slow host) falls back to the letter tile. */
async function loadLogo(url: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !/image\/(png|jpe?g)/.test(type)) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function renderInvoicePdf(invoice: Invoice, options: PayOption[], pageUrl: string) {
  const logo = await loadLogo(invoice.company.logoUrl);
  return renderToBuffer(<InvoicePdf invoice={invoice} options={options} pageUrl={pageUrl} logo={logo} />);
}

export function pdfFileName(invoice: Pick<Invoice, "number">) {
  return `${invoice.number.replace(/[^\w.-]+/g, "-")}.pdf`;
}
