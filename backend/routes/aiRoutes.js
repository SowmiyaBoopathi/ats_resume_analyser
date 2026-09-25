import express from "express";
import multer from "multer";
import { evaluateResume, testAiPipeline, generateResume } from "../controllers/aiController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOCX, and TXT files are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

router.post("/evaluate", authenticateToken, upload.single("resume"), evaluateResume);
router.post("/generate-resume", authenticateToken, generateResume);
router.get("/api/test-ai", testAiPipeline);

export default router;