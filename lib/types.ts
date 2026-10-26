export const INVOICE_STATUSES = ["draft", "not_paid", "paid"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type Note = { title: string; body: string };

export type Business = {
  name: string;
  email: string | null;
  contactEmail: string | null;
  tagline: string | null;
  logoUrl: string | null;
  defaultCurrency: string;
  defaultNotes: Note[];
};

export type InvoiceItem = {
  title: string;
  description: string | null;
  /** Decimal string such as "4000.00"; null means the item is included at no charge. */
  amount: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  slug: string;
  title: string;
  status: InvoiceStatus;
  clientName: string;
  clientEmail: string | null;
  /** ISO date, YYYY-MM-DD */
  issueDate: string;
  dueDate: string | null;
  currency: string;
  taxNote: string;
  paymentUrl: string | null;
  paymentLabel: string;
  notes: Note[];
  items: InvoiceItem[];
};

export type InvoiceSummary = Pick<
  Invoice,
  "id" | "number" | "slug" | "title" | "status" | "clientName" | "issueDate" | "dueDate" | "currency"
> & { total: string };

export type InvoiceInput = Omit<Invoice, "id">;

export type BusinessInput = Business;
