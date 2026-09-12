import { Router } from "express";
import { createDonation, listDonations } from "../controllers/donationController.js";

const router = Router();
router.post("/", createDonation);
router.get("/", listDonations);
export default router;
