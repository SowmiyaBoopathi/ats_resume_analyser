import express from "express";

import { getUserHistory } from "../controllers/historyController.js";

import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/api/history/:email",
  authenticateToken,
  getUserHistory
);

export default router;