export interface Product {
  id: number;
  type: "product" | "service";
  name: string;
  unit_price: number;
  tax_rate: number | null;
  track_stock: boolean;
  quantity_on_hand: number;
  reorder_level: number | null;
  created_at: string;
}
