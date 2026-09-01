export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "cancelled";

export interface InvoiceLine {
  id?: number;
  product_id: number | null;
  description: string;
  qty: number;
  unit_price: number;
  tax_rate: number | null;
  line_total: number;
}

export interface Invoice {
  id: number;
  customer_id: number;
  number: string;
  status: InvoiceStatus;
  display_status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_total: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  cancelled_at: string | null;
  created_at: string;
  customer: { id: number; name: string; email: string | null };
  lines: InvoiceLine[];
  payments: Payment[];
}

export interface Payment {
  id: number;
  amount: number;
  method: string;
  paid_at: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  type: "product" | "service";
  unit_price: number;
  tax_rate: number | null;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
}
