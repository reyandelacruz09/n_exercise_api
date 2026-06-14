export interface UsersTable {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    role: string;
    created_at: Date;
  }