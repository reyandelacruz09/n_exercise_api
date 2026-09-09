export interface CustomersTable {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password_hash: string | null;
    is_active: boolean;
    created_at: Date;
  }