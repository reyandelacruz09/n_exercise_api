export interface AuditLogsTable {
    id: number;
    entity: string;
    action: string;
    entity_id: number | null;
    description: string | null;
    user_id: number | null;
    created_at: Date;
  }
