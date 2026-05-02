import { Request, Response } from "express";
import { employeeService } from "../services/employeeService";

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, position, salary } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await employeeService.createEmployee({
      first_name,
      last_name,
      email,
      position,
      salary,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create employee" });
  }
};
