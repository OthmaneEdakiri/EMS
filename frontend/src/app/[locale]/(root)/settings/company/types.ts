export interface CompanySettings {
  id: number;
  name: string;
  logo: string | null;
  currency: string;
  locale: string;
  invoice_prefix: string;
  has_invoices: boolean;
}
