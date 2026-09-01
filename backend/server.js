import express from "express";
import mysql from "mysql";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import crypto from "crypto"; // Added for SHA-256 JD hashing
import jwt from "jsonwebtoken"; // Added for JWT authentication
import * as pdfParseLib from "pdf-parse";
import { GoogleGenAI } from "@google/genai"; 

const pdfParse = pdfParseLib.default || pdfParseLib;

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_123!";
const JWT_EXPIRES_IN = "24h";

// Initialize Google GenAI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "crud",
  port: 4306,
};

const dbPool = mysql.createPool(DB_CONFIG);
dbPool.getConnection((err, connection) => {
  if (err) console.error(`DB Failed ❌: ${err.message}`);
  else {
    console.log("DB Connected ✅");
    connection.release();
  }
});

const upload = multer({ dest: "uploads/" });

// ==================== JWT AUTHENTICATION MIDDLEWARE ====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing!" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token!" });
    }
    req.user = user; // Attach authenticated user payload to request
    next();
  });
}

// ==================== MATHEMATICAL COSINE SIMILARITY ENGINE ====================
function calculateCosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// -------------------- Helper: Generate SHA-256 Hash for JD --------------------
function generateJDHash(jobDescription) {
  return crypto.createHash("sha256").update(jobDescription.trim()).digest("hex");
}

// Helper: Promise wrapper for database queries to use with async/await
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    dbPool.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// -------------------- Signup --------------------
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required!" });

  try {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);
    dbPool.query(
      "INSERT INTO ats_users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err, result) => {
        if (err?.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "Email already registered!" });
        if (err) return res.status(500).json({ message: "Server error during signup." });
        
        const newUser = { id: result.insertId, name, email };
        const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.status(201).json({
          message: "Account created successfully!",
          token,
          user: newUser
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error during registration." });
  }
});

// -------------------- Login --------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required!" });

  dbPool.query("SELECT * FROM ats_users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!result.length) return res.status(401).json({ message: "Invalid email or password!" });

    const user = result[0];
    try {
      const bcrypt = await import("bcryptjs");
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password!" });
      
      const { password: _, ...userInfo } = user;
      
      // Generate JWT Token
      const token = jwt.sign(userInfo, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.status(200).json({
        message: "Login successful!",
        token,
        user: userInfo
      });
    } catch {
      res.status(500).json({ message: "Server error during authentication." });
    }
  });
});

// -------------------- OPTIMIZED NON-BLOCKING PDF PARSER --------------------
const extractTextFromPDF = async (filePath) => {
  const dataBuffer = await fs.promises.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// ==================== ADVANCED AI EVALUATE ENDPOINT (PROTECTED) ====================
app.post("/evaluate", authenticateToken, upload.single("resume"), async (req, res) => {
  const { jobDescription, name, job, experience } = req.body;
  const userEmail = req.user.email || req.body.email || "guest@interviewready.com";
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

    // --- PIPELINE LAYER 1: MATHEMATICAL SEMANTIC MATRIX CALCULATIONS WITH CACHING ---
    let calculatedSimilarity = 0;

    if (jobDescription && jobDescription.trim().length > 10) {
      try {
        const jdHash = generateJDHash(jobDescription);
        let jdVector = null;

        // 1. Check if JD embedding already exists in the database cache
        const existingRows = await queryAsync(
          "SELECT embedding FROM job_embeddings WHERE job_hash = ?",
          [jdHash]
        );

        if (existingRows.length > 0) {
          console.log("⚡ JD Embedding found in cache (Database Hit)! Skipping API call.");
          const rawEmbedding = existingRows[0].embedding;
          jdVector = typeof rawEmbedding === "string" ? JSON.parse(rawEmbedding) : rawEmbedding;
        } else {
          console.log("🔍 JD Embedding not found. Generating via Gemini API...");
        }

        // 2. Generate resume embedding concurrently
        const [resumeEmbeddingResponse, jdEmbeddingResponse] = await Promise.all([
          ai.models.embedContent({ model: "text-embedding-004", contents: resumeText }),
          jdVector ? Promise.resolve(null) : ai.models.embedContent({ model: "text-embedding-004", contents: jobDescription })
        ]);

        const vectorA = resumeEmbeddingResponse.embedding.values;
        let vectorB = jdVector;

        if (!vectorB && jdEmbeddingResponse) {
          vectorB = jdEmbeddingResponse.embedding.values;
          // Save newly generated JD embedding to database
          await queryAsync(
            "INSERT IGNORE INTO job_embeddings (job_hash, embedding) VALUES (?, ?)",
            [jdHash, JSON.stringify(vectorB)]
          );
          console.log("💾 New JD Embedding securely cached to database.");
        }

        calculatedSimilarity = calculateCosineSimilarity(vectorA, vectorB);
        console.log(`Vector Cosine Similarity calculated: ${calculatedSimilarity.toFixed(4)}`);
      } catch (embedError) {
        console.error("⚠️ Embedding generation or caching failed, defaulting baseline similarity:", embedError.message);
        calculatedSimilarity = 0.5; 
      }
    }

    // --- PIPELINE LAYER 2: PRODUCTION RECRUITER SYSTEM PROMPTING ---
    const prompt = `
      You are an elite corporate technical recruiter and autonomous ATS screening algorithm assessing a candidate.
      Target Role Context: "${job || "Software Engineer"}"
      Claimed Experience Metric: ${experience || "0"} years

      CRITICAL SCORING WEIGHTS (Total allocation: 100 points):
      1. Keyword Match (Max 35 pts): Contextual overlap of stack skills, tools, and paradigms.
      2. Skills Depth (Max 20 pts): Practical tool density and exposure level.
      3. Structural Sections (Max 15 pts): Verifying existence of Summary, Experience, Education, and Projects modules.
      4. Quantifiable Achievements (Max 15 pts): Detection of explicit numeric impact metrics (%, $, scale numbers).
      5. Formatting & Profiles (Max 10 pts): Markers identifying active GitHub, LinkedIn links or personal portals.
      6. Contact Integrity (Max 5 pts): Valid email or phone sequence patterns.

      STRICT OPERATIONAL CRITERIA:
      - Evaluate contextually. If the JD requests "Backend Development" and the resume states "Built robust Node/Express APIs", award points semantically instead of requiring strict substring equality matches.
      - The absolute sum of category values within the "breakdown" object MUST mathematically total the exact "overall_score".
      - Deliver 5 comprehensive, highly challenging custom technical interview questions in "interview_prep_questions" confronting the stack gaps found.

      Resume Text:
      """${resumeText}"""

      Target Job Description (JD):
      """${jobDescription || "Not provided. Critically evaluate generally based on standard modern development best practices for a " + job}"""
    `;

    // Make structured generation call
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            overall_score: { type: "INTEGER" },
            summary: { type: "STRING" },
            strengths: { type: "ARRAY", items: { type: "STRING" } },
            improvements: { type: "ARRAY", items: { type: "STRING" } },
            missing_keywords: { type: "ARRAY", items: { type: "STRING" } },
            detected_skills: { type: "ARRAY", items: { type: "STRING" } },
            interview_prep_questions: { type: "ARRAY", items: { type: "STRING" } }, 
            breakdown: {
              type: "OBJECT",
              properties: {
                keyword_match: {
                  type: "OBJECT",
                  properties: { score: { type: "INTEGER" }, max: { type: "INTEGER" } },
                  required: ["score", "max"]
                },
                skills: {
                  type: "OBJECT",
                  properties: { score: { type: "INTEGER" }, max: { type: "INTEGER" } },
                  required: ["score", "max"]
                },
                sections: {
                  type: "OBJECT",
                  properties: { score: { type: "INTEGER" }, max: { type: "INTEGER" } },
                  required: ["score", "max"]
                },
                achievements: {
                  type: "OBJECT",
                  properties: { score: { type: "INTEGER" }, max: { type: "INTEGER" } },
                  required: ["score", "max"]
                },
                formatting: {
                  type: "OBJECT",
                  properties: { score: { type: "INTEGER" }, max: { type: "INTEGER" } },
                  required: ["score", "max"]
                },
                contact: {
                  type: "OBJECT",
                  properties: { score: { type: "INTEGER" }, max: { type: "INTEGER" } },
                  required: ["score", "max"]
                }
              },
              required: ["keyword_match", "skills", "sections", "achievements", "formatting", "contact"]
            }
          },
          required: [
            "overall_score", 
            "summary", 
            "strengths", 
            "improvements", 
            "missing_keywords", 
            "detected_skills", 
            "interview_prep_questions", 
            "breakdown"
          ]
        }
      }
    });

    const parsedEvaluation = JSON.parse(response.text);
    parsedEvaluation.semantic_similarity = calculatedSimilarity;

    // ==================== HISTORICAL DATA PERSISTENCE LAYER ====================
    const insertHistoryQuery = `
      INSERT INTO ats_history 
      (user_email, candidate_name, target_job, overall_score, file_name, evaluation_json) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    dbPool.query(
      insertHistoryQuery,
      [
        userEmail,
        name || req.user.name || "Not provided",
        job || "Not specified",
        parsedEvaluation.overall_score || 0,
        file.originalname,
        JSON.stringify(parsedEvaluation) 
      ],
      (dbErr) => {
        if (dbErr) {
          console.error("⚠️ Database telemetry logging failed:", dbErr.message);
        } else {
          console.log(`💾 Evaluation safely cached to MySQL history for: ${userEmail}`);
        }
      }
    );

    res.status(200).json({
      success: true,
      evaluation: parsedEvaluation,
      file: file.originalname,
      candidate: {
        name: name || req.user.name || "Not provided",
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
});

app.post("/analyze", authenticateToken, upload.single("resume"), async (req, res) => {
  req.url = "/evaluate";
  app._router.handle(req, res, () => {});
});

// ==================== HISTORICAL LOG RETRIEVAL ROUTE (PROTECTED) ====================
app.get("/api/history/:email", authenticateToken, (req, res) => {
  const { email } = req.params;
  
  // Basic security check: Ensure users can only view their own history unless authorized
  if (req.user.email !== email) {
    return res.status(403).json({ error: "Unauthorized access to requested user history." });
  }

  const fetchQuery = `
    SELECT id, target_job, overall_score, file_name, created_at, evaluation_json 
    FROM ats_history 
    WHERE user_email = ? 
    ORDER BY created_at DESC
  `;

  dbPool.query(fetchQuery, [email], (err, results) => {
    if (err) {
      console.error("❌ History retrieval error:", err.message);
      return res.status(500).json({ error: "Database retrieval failure" });
    }
    
    try {
      const formattedHistory = results.map(row => ({
        id: row.id,
        target_job: row.target_job,
        overall_score: row.overall_score,
        file_name: row.file_name,
        created_at: row.created_at,
        evaluation: JSON.parse(row.evaluation_json)
      }));
      
      res.status(200).json({ success: true, history: formattedHistory });
    } catch (parseErr) {
      console.error("❌ JSON structural parsing error:", parseErr.message);
      res.status(500).json({ error: "Data corruption error during compilation." });
    }
  });
});

// -------------------- Change Password (PROTECTED) --------------------
app.post("/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const email = req.user.email; // Extracted securely from JWT token

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "All fields are required!" });

  dbPool.query("SELECT * FROM ats_users WHERE email = ?", [email], async (err, result) => {
    if (err || !result.length)
      return res.status(404).json({ message: "User not found." });

    const user = result[0];
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect!" });

    const hashed = await bcrypt.hash(newPassword, 10);
    dbPool.query("UPDATE ats_users SET password = ? WHERE email = ?", [hashed, email], (err) => {
      if (err) return res.status(500).json({ message: "Failed to update password." });
      res.status(200).json({ message: "Password updated successfully!" });
    });
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "Full-Stack AI Resume Analyzer", version: "5.0-AI" });
});

// -------------------- TEMPORARY AI TEST ROUTE --------------------
app.get("/api/test-ai", async (req, res) => {
  try {
    console.log("Checking GEMINI_API_KEY initialization...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Respond with exactly the words: 'Gemini pipeline is working! ✅'",
    });
    console.log("Gemini Response:", response.text);
    res.status(200).json({
      success: true,
      message: "Backend connection to Gemini is successful!",
      ai_response: response.text.trim()
    });
  } catch (err) {
    console.error("❌ Gemini Test Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Gemini API integration failed.",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`\n🚀 Full-Stack AI Server running on port ${PORT}`);
});
