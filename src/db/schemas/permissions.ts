export interface PermissionsTable {
  id: number;
  name: string;
  created_at: Date;
}

export interface RolePermissionsTable {
  id: number;
  role: string;
  permission_id: number;
}
