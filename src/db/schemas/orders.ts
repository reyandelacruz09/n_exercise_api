export interface OrdersTable {
    id: number;
    customer_id: number;
    order_number: string;
    status: string;
    total_amount: number;
    created_by: number | null;
    created_at: Date;
  }
