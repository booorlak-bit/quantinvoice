export const INVOICE_STATUSES = ["draft", "not_paid", "paid"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Status filter values: the stored statuses plus "overdue" (not paid and past due). */
export const STATUS_FILTERS = ["draft", "not_paid", "overdue", "paid"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const INVOICE_STYLES = ["light", "dark", "alt-light", "alt-dark", "quantum"] as const;
export type InvoiceStyle = (typeof INVOICE_STYLES)[number];

export type Note = { title: string; body: string };

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  theme: "light" | "dark";
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  email: string | null;
  contactEmail: string | null;
  tagline: string | null;
  logoUrl: string | null;
  address: string | null;
  taxId: string | null;
  website: string | null;
  /** The part before the @ that invoice emails come from, on the app's sending domain. */
  sender: string | null;
  invoicePrefix: string;
  defaultCurrency: string;
  defaultNotes: Note[];
  isDefault: boolean;
};

export type Project = { id: string; clientId: string; name: string };

export type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  projects: Project[];
};

export type ClientSummary = Client & {
  invoiceCount: number;
  /** Per currency: invoiced (non-draft), paid and outstanding totals as decimal strings. */
  totals: { currency: string; invoiced: string; paid: string; outstanding: string }[];
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
  issueDate: string;
  dueDate: string | null;
  currency: string;
  taxNote: string;
  style: InvoiceStyle;
  stripeLink: string | null;
  notes: Note[];
  items: InvoiceItem[];
  company: Company;
  client: Client;
  project: Project | null;
  templateId: string | null;
  methodIds: string[];
  sentAt: string | null;
  paidAt: string | null;
  paidTotal: string;
  createdAt: string;
};

export type InvoiceSummary = {
  id: string;
  number: string;
  slug: string;
  title: string;
  status: InvoiceStatus;
  overdue: boolean;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  total: string;
  paidTotal: string;
  companyId: string;
  companyName: string;
  clientId: string;
  clientName: string;
  clientCompany: string | null;
  projectId: string | null;
  projectName: string | null;
};

export type InvoiceInput = {
  companyId: string;
  clientId: string;
  projectId: string | null;
  templateId: string | null;
  number: string;
  slug: string;
  title: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  taxNote: string;
  style: InvoiceStyle;
  stripeLink: string | null;
  notes: Note[];
  items: InvoiceItem[];
  methodIds: string[];
};

export const PERIODS = ["all", "this-month", "last-month", "last-30", "quarter", "year", "custom"] as const;
export type Period = (typeof PERIODS)[number];

/** Shared filters of the invoices list and the dashboard; every field is optional. */
export type InvoiceFilters = {
  companyId?: string;
  clientId?: string;
  projectId?: string;
  status?: StatusFilter;
  currency?: string;
  period?: Period;
  from?: string;
  to?: string;
  query?: string;
};

export const SORT_KEYS = ["number", "title", "client", "project", "status", "issue", "due", "total"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type Sort = { key: SortKey; dir: "asc" | "desc" };

export const PAYMENT_METHOD_TYPES = ["stripe", "crypto", "bank", "link"] as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

/** What the payer sees for each kind of method. Stripe uses a Payment Link for now; the API mode comes later. */
export type PaymentMethodDetails = {
  stripe: { url: string };
  crypto: { asset: string; network: string; address: string; memo: string | null };
  bank: {
    accountHolder: string;
    bankName: string | null;
    iban: string | null;
    accountNumber: string | null;
    swift: string | null;
    routingNumber: string | null;
    bankAddress: string | null;
    reference: string | null;
  };
  link: { url: string; label: string };
};

export type PaymentMethod = {
  [T in PaymentMethodType]: { id: string; name: string; type: T; details: PaymentMethodDetails[T]; isDefault: boolean };
}[PaymentMethodType];
