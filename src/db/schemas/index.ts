
import { UsersTable } from "./users";
import { ProductsTable } from "./products";
import { CustomersTable } from "./customers";
import { OrdersTable } from "./orders";
import { OrderItemsTable } from "./orderItems";
import { StockTransactionsTable } from "./stockTransactions";
import { AuditLogsTable } from "./auditLogs";
import { PermissionsTable, RolePermissionsTable } from "./permissions";
import { FormFieldsTable } from "./formFields";
import {
  FormTemplateFieldsTable,
  FormTemplatesTable,
} from "./formTemplates";
import {
  CustomerFormAssignmentsTable,
  CustomerGroupMembersTable,
  CustomerGroupsTable,
} from "./customerGroups";

export interface Database {
  users: UsersTable;
  products: ProductsTable;
  customers: CustomersTable;
  orders: OrdersTable;
  order_items: OrderItemsTable;
  stock_transactions: StockTransactionsTable;
  audit_logs: AuditLogsTable;
  permissions: PermissionsTable;
  role_permissions: RolePermissionsTable;
  form_fields: FormFieldsTable;
  form_templates: FormTemplatesTable;
  form_template_fields: FormTemplateFieldsTable;
  customer_form_assignments: CustomerFormAssignmentsTable;
  customer_groups: CustomerGroupsTable;
  customer_group_members: CustomerGroupMembersTable;
}