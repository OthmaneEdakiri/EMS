export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  address: string | null;
  created_at: string;
}
