import fs from "fs";
import dbPool from "../config/db.js";
import { extractTextFromPDF } from "../services/pdfService.js";
import { processSemanticSimilarity } from "../services/embeddingService.js";
import { evaluateResumeWithAI, testGeminiConnection } from "../services/aiService.js";

export const evaluateResume = async (req, res) => {
  const { jobDescription, name, job, experience } = req.body;
  const userEmail = req.user?.email || req.body.email || "guest@interviewready.com";
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No resume file uploaded." });
  const filePath = file.path;

  try {
    const ext = file.originalname.split(".").pop().toLowerCase();
    let resumeText = "";

    if (ext === "pdf") resumeText = await extractTextFromPDF(filePath);
    else if (ext === "txt") resumeText = await fs.promises.readFile(filePath, "utf8");
    else return res.status(400).json({ error: "Unsupported file type. Upload PDF or TXT only." });

    if (!resumeText || resumeText.trim().length < 50)
      return res.status(400).json({ error: "Resume text is too short or could not be extracted." });

    // Layer 1: Vector Similarity Calculations
    const calculatedSimilarity = await processSemanticSimilarity(resumeText, jobDescription);

    // Layer 2: LLM Evaluation Parsing
    const parsedEvaluation = await evaluateResumeWithAI(resumeText, jobDescription, job, experience);
    parsedEvaluation.semantic_similarity = calculatedSimilarity;

    // Layer 3: Persist History
    const insertHistoryQuery = `
      INSERT INTO ats_history 
      (user_email, candidate_name, target_job, overall_score, file_name, evaluation_json) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    dbPool.query(
      insertHistoryQuery,
      [
        userEmail,
        name || req.user?.name || "Not provided",
        job || "Not specified",
        parsedEvaluation.overall_score || 0,
        file.originalname,
        JSON.stringify(parsedEvaluation)
      ],
      (dbErr) => {
        if (dbErr) console.error("⚠️ History logging failed:", dbErr.message);
        else console.log(`💾 Evaluation cached to MySQL for: ${userEmail}`);
      }
    );

    res.status(200).json({
      success: true,
      evaluation: parsedEvaluation,
      file: file.originalname,
      candidate: {
        name: name || req.user?.name || "Not provided",
        job: job || "Not specified",
        experience: experience || "Not specified",
      },
    });

  } catch (err) {
    console.error("❌ Evaluation Error:", err.message);
    res.status(500).json({ error: "Failed to evaluate resume via AI pipeline." });
  } finally {
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
  }
};

export const testAiPipeline = async (req, res) => {
  try {
    const message = await testGeminiConnection();
    res.status(200).json({
      success: true,
      message: "Backend connection to Gemini is successful!",
      ai_response: message
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Gemini API integration failed.",
      details: err.message
    });
  }
};