import express from "express";
import multer from "multer";
import { evaluateResume, testAiPipeline } from "../controllers/aiController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/evaluate", authenticateToken, upload.single("resume"), evaluateResume);
router.post("/analyze", authenticateToken, upload.single("resume"), evaluateResume);
router.get("/api/test-ai", testAiPipeline);

export default router;