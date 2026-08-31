export interface Product {
  id: number;
  type: "product" | "service";
  name: string;
  unit_price: number;
  tax_rate: number | null;
  created_at: string;
}
