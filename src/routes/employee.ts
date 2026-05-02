import { Router } from "express";
import { getEmployees, createEmployee } from "../controllers/employeeController";

const router = Router();

router.get("/", getEmployees);
router.post("/", createEmployee);

export default router;
