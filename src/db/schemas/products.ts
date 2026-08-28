export interface ProductsTable {
    id: number;
    name: string;
    price: number;
    stock: number;
    cost_price: number | null;
    reorder_level: number | null;
  }
