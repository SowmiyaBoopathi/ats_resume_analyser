import fs from "fs";
import dbPool from "../config/db.js";
import { extractTextFromFile } from "../services/pdfService.js";
import { processSemanticSimilarity } from "../services/embeddingService.js";
import { evaluateResumeWithAI, testGeminiConnection } from "../services/aiService.js";
import { generateATSResume } from "../services/resumeGeneratorService.js";

export const evaluateResume = async (req, res) => {
  const { jobDescription, name, job, experience } = req.body;
  const userEmail = req.user?.email || req.body.email || "guest@interviewready.com";
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No resume file uploaded." });
  }

  const filePath = file.path;

  try {
    const ext = file.originalname.split(".").pop().toLowerCase();
    const resumeText = await extractTextFromFile(filePath, ext);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: "Resume text is too short or could not be extracted." });
    }

    const calculatedSimilarity = await processSemanticSimilarity(resumeText, jobDescription);
    const parsedEvaluation = await evaluateResumeWithAI(resumeText, jobDescription, job, experience);
    
    parsedEvaluation.semantic_similarity = calculatedSimilarity;

    const insertHistoryQuery = `
      INSERT INTO evaluations
      (user_email, candidate_name, target_job, overall_score, file_name, evaluation_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      await dbPool.query(insertHistoryQuery, [
        userEmail,
        name || req.user?.name || "Not provided",
        job || "Not specified",
        parsedEvaluation.overall_score || 0,
        file.originalname,
        JSON.stringify(parsedEvaluation)
      ]);
    } catch (dbErr) {
      console.error("⚠️ History logging failed:", dbErr.message);
    }

    return res.status(200).json({
      success: true,
      evaluation: parsedEvaluation,
      resumeText,
      jobDescription,
      file: file.originalname,
      candidate: {
        name: name || req.user?.name || "Not provided",
        job: job || "Not specified",
        experience: experience || "Not specified"
      }
    });

  } catch (err) {
    console.error("❌ Evaluation Error:", err.message);
    return res.status(500).json({ error: "Failed to evaluate resume via AI pipeline." });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
};

export const generateResume = async (req, res) => {
  const { resumeText, jobDescription = "", confirmedSkills } = req.body;

  if (!resumeText || typeof resumeText !== "string") {
    return res.status(400).json({ success: false, error: "Resume text is required." });
  }

  try {
    const resume = await generateATSResume({
      resumeText,
      jobDescription,
      confirmedSkills: Array.isArray(confirmedSkills) ? confirmedSkills : [],
    });

    return res.status(200).json({ success: true, resume });
  } catch (err) {
    console.error("Resume generation error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to generate resume." });
  }
};

export const testAiPipeline = async (req, res) => {
  try {
    const message = await testGeminiConnection();
    return res.status(200).json({
      success: true,
      message: "Backend connection to Gemini is successful!",
      ai_response: message
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Gemini API integration failed.",
      details: err.message
    });
  }
};