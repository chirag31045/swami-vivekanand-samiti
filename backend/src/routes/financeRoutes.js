import { Router } from "express";
import { getFinanceSummary } from "../controllers/financeController.js";

const router = Router();
router.get("/summary", getFinanceSummary);
export default router;
