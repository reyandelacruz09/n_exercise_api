import { UsersTable } from "./users";
import { TasksTable } from "./tasks";
import { EmployeeTable } from "./employee";

export interface Database {
  users: UsersTable;
  tasks: TasksTable;
  employees: EmployeeTable;
}