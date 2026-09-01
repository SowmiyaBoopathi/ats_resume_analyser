import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes Mount
app.use(authRoutes);
app.use(aiRoutes);
app.use(historyRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "Full-Stack AI Resume Analyzer", version: "5.0-AI" });
});

export default app;