
import { UsersTable } from "./users";
import { ProductsTable } from "./products";
import { CustomersTable } from "./customers";
import { OrdersTable } from "./orders";
import { OrderItemsTable } from "./orderItems";

export interface Database {
  users: UsersTable;
  products: ProductsTable;
  customers: CustomersTable;
  orders: OrdersTable;
  order_items: OrderItemsTable;
}