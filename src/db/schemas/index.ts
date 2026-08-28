
import { UsersTable } from "./users";
import { ProductsTable } from "./products";
import { CustomersTable } from "./customers";
import { OrdersTable } from "./orders";
import { OrderItemsTable } from "./orderItems";
import { StockTransactionsTable } from "./stockTransactions";
import { AuditLogsTable } from "./auditLogs";

export interface Database {
  users: UsersTable;
  products: ProductsTable;
  customers: CustomersTable;
  orders: OrdersTable;
  order_items: OrderItemsTable;
  stock_transactions: StockTransactionsTable;
  audit_logs: AuditLogsTable;
}