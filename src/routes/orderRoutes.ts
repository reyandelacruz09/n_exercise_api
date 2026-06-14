import { Router } from "express";
import * as orderController from "../controllers/orderController.js";

const router = Router();

router.get("/", orderController.getOrders);

export default router;