import { Router } from "express";
import * as customerPortalController from "../controllers/customerPortalController";
import { authenticateCustomerToken } from "../middleware/customerAuthMiddleware";

const router = Router();

router.use(authenticateCustomerToken);

router.get("/catalog", customerPortalController.getCatalog);
router.get("/form", customerPortalController.getForm);
router.get("/orders", customerPortalController.getOrders);
router.get("/orders/:id", customerPortalController.getOrderById);
router.post("/orders", customerPortalController.createOrder);

export default router;