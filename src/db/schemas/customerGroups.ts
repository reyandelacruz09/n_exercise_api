export interface CustomerGroupsTable {
  id: number;
  name: string;
  template_id: number | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerGroupMembersTable {
  id: number;
  group_id: number;
  customer_id: number;
  created_at: Date;
}

export interface CustomerFormAssignmentsTable {
  id: number;
  customer_id: number;
  template_id: number;
  created_at: Date;
}