import { Request, Response } from "express";
import { taskService } from "../services/taskService";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await taskService.createTask({
      title,
      status: status || "pending",
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
};
