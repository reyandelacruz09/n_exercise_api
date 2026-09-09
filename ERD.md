# Database ERD

Entity-relationship diagram for the `postgres_db` schema. All tables are defined by
TypeScript interfaces in [`src/db/schemas/`](src/db/schemas) and created by migrations
in [`src/db/migrations/`](src/db/migrations).

## Diagram

```mermaid
erDiagram
    USERS {
        serial id PK
        varchar(100) username UK
        varchar(255) email UK
        text password_hash
        varchar(50) role
        timestamp created_at
    }

    PERMISSIONS {
        serial id PK
        varchar(100) name UK
        timestamp created_at
    }

    ROLE_PERMISSIONS {
        serial id PK
        varchar(50) role
        serial permission_id FK
    }

    CUSTOMERS {
        serial id PK
        varchar(100) first_name
        varchar(100) last_name
        varchar(255) email UK
        varchar(50) phone NL
        text address NL
        varchar(255) password_hash NL
        boolean is_active
        timestamp created_at
    }

    PRODUCTS {
        serial id PK
        varchar(255) name
        text description NL
        numeric price NL
        integer stock
        numeric cost_price NL
        integer reorder_level NL
        boolean is_active
        timestamp created_at
    }

    ORDERS {
        serial id PK
        integer customer_id FK
        varchar(50) order_number UK
        varchar(50) status
        numeric total_amount
        integer created_by FK NL
        timestamp created_at
        jsonb custom_fields NL
    }

    ORDER_ITEMS {
        serial id PK
        integer order_id FK
        integer product_id FK
        integer quantity
        numeric unit_price
    }

    STOCK_TRANSACTIONS {
        serial id PK
        integer product_id FK
        integer quantity
        varchar(20) type
        numeric cost_price NL
        text note NL
        integer created_by FK NL
        timestamp created_at
    }

    AUDIT_LOGS {
        serial id PK
        varchar(50) entity
        varchar(20) action
        integer entity_id NL
        text description NL
        integer user_id FK NL
        timestamp created_at
    }

    FORM_TEMPLATES {
        serial id PK
        varchar(100) name
        text description NL
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    FORM_TEMPLATE_FIELDS {
        serial id PK
        integer template_id FK
        varchar(100) label
        varchar(100) field_key
        varchar(50) field_type
        jsonb options NL
        boolean required
        varchar(255) placeholder NL
        integer sort_order
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    FORM_FIELDS {
        serial id PK
        integer customer_id FK
        varchar(100) label
        varchar(100) field_key
        varchar(50) field_type
        jsonb options NL
        boolean required
        varchar(255) placeholder NL
        integer sort_order
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMER_FORM_ASSIGNMENTS {
        serial id PK
        integer customer_id FK
        integer template_id FK
        timestamp created_at
    }

    CUSTOMER_GROUPS {
        serial id PK
        varchar(100) name
        integer template_id FK NL
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMER_GROUP_MEMBERS {
        serial id PK
        integer group_id FK
        integer customer_id FK
        timestamp created_at
    }

    USERS ||--o{ ORDERS : "created_by"
    USERS ||--o{ STOCK_TRANSACTIONS : "created_by"
    USERS ||--o{ AUDIT_LOGS : "user_id"
    CUSTOMERS ||--o{ ORDERS : "customer_id"
    CUSTOMERS ||--o{ FORM_FIELDS : "customer_id"
    CUSTOMERS ||--o{ CUSTOMER_FORM_ASSIGNMENTS : "customer_id"
    PRODUCTS ||--o{ ORDER_ITEMS : "product_id"
    PRODUCTS ||--o{ STOCK_TRANSACTIONS : "product_id"
    ORDERS ||--o{ ORDER_ITEMS : "order_id"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "permission_id"
    FORM_TEMPLATES ||--o{ FORM_TEMPLATE_FIELDS : "template_id"
    FORM_TEMPLATES ||--o{ CUSTOMER_FORM_ASSIGNMENTS : "template_id"
    FORM_TEMPLATES |o--o{ CUSTOMER_GROUPS : "template_id"
    CUSTOMER_GROUPS ||--o{ CUSTOMER_GROUP_MEMBERS : "group_id"
    CUSTOMERS ||--o{ CUSTOMER_GROUP_MEMBERS : "customer_id"
```

PK = primary key · FK = foreign key · UK = unique · NL = nullable

## Relationships

| # | From | To | FK column | Delete behavior | Notes |
|---|------|----|-----------|-----------------|-------|
| 1 | `orders` | `customers` | `customer_id` | **RESTRICT** (default) | An order always belongs to a customer |
| 2 | `orders` | `users` | `created_by` | **SET NULL** (default, nullable) | Staff user who created the order |
| 3 | `order_items` | `orders` | `order_id` | **CASCADE** | Deleting an order removes its line items |
| 4 | `order_items` | `products` | `product_id` | RESTRICT | Item references the product at current price |
| 5 | `stock_transactions` | `products` | `product_id` | RESTRICT | Stock in/out/adjustment per product |
| 6 | `stock_transactions` | `users` | `created_by` | RESTRICT (nullable) | Staff user who recorded the transaction |
| 7 | `audit_logs` | `users` | `user_id` | RESTRICT (nullable) | Actor; `entity_id` is an app-level reference |
| 8 | `role_permissions` | `permissions` | `permission_id` | **CASCADE** | `role` maps to `users.role` by convention (no FK) |
| 9 | `form_fields` | `customers` | `customer_id` | **CASCADE** | Per-customer order form fields |
| 10 | `form_template_fields` | `form_templates` | `template_id` | **CASCADE** | Reusable template fields |
| 11 | `customer_form_assignments` | `customers` | `customer_id` | **CASCADE** | Direct template assignment |
| 12 | `customer_form_assignments` | `form_templates` | `template_id` | **CASCADE** | |
| 13 | `customer_groups` | `form_templates` | `template_id` | **SET NULL** (nullable) | Group falls back to no template |
| 14 | `customer_group_members` | `customer_groups` | `group_id` | **CASCADE** | |
| 15 | `customer_group_members` | `customers` | `customer_id` | **CASCADE** | |

## Unique constraints & indexes

| Table | Constraint / index | Columns |
|-------|-------------------|---------|
| `users` | unique | `username` |
| `users` | unique | `email` |
| `customers` | unique | `email` |
| `orders` | unique | `order_number` |
| `permissions` | unique | `name` |
| `form_fields` | `uq_form_fields_customer_key` | `(customer_id, field_key)` |
| `form_fields` | `idx_form_fields_customer_sort` | `(customer_id, sort_order)` |
| `form_template_fields` | `uq_form_template_fields_key` | `(template_id, field_key)` |
| `customer_form_assignments` | `uq_customer_form_assignments` | `(customer_id, template_id)` |
| `customer_group_members` | `uq_customer_group_members` | `(group_id, customer_id)` |
| `role_permissions` | `idx_role_permissions_role` | `(role)` |
| `audit_logs` | `idx_audit_logs_entity` | `(entity, created_at)` |

## Key behaviors

- **Form resolution precedence** for a customer's order form:
  1. `form_fields` owned directly by the customer
  2. `customer_form_assignments` → the assigned template's `form_template_fields`
  3. the customer's group → `customer_groups.template_id` → template fields
  4. none of the above → no custom fields
- `orders.custom_fields` (jsonb) stores the submitted custom-field answers (label → value) per order.
- Only `is_active` products appear in the customer portal catalog; `is_active` customers can sign in.
- `users.role` values (`admin`, `user`) are granted permissions through `role_permissions`.