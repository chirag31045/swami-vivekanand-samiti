import express from "express";
import {
  handleDonationWebhook,
} from "../controllers/donationWebhookController.js";

const router = express.Router();

router.post(
  "/",
  handleDonationWebhook,
);

export default router;
