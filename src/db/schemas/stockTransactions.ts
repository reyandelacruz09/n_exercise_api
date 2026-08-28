export interface StockTransactionsTable {
    id: number;
    product_id: number;
    quantity: number;
    type: string;
    cost_price: number | null;
    note: string | null;
    created_by: number | null;
    created_at: Date;
  }
