export interface TasksTable {
    id: number;
    title: string;
    status: "pending" | "running" | "done";
    created_at: Date;
}