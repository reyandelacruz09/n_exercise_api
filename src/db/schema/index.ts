import type { UsersTable } from "./users";
import type { ProductsTable } from "./products";
import type { OrdersTable } from "./orders";
import type { CustomersTable } from "./customers";

export interface Database {
  users: UsersTable;
  customers: CustomersTable;
  products: ProductsTable;
  orders: OrdersTable;
}