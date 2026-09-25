import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

// Routes
app.use(authRoutes);
app.use(aiRoutes);
app.use(historyRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Full-Stack AI Resume Analyzer",
    version: "5.0-AI"
  });
});

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});