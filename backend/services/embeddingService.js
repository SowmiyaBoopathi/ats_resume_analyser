import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { queryAsync } from "../config/db.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function calculateCosineSimilarity(vectorA, vectorB) {
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

export function generateJDHash(jobDescription) {
  return crypto.createHash("sha256").update(jobDescription.trim()).digest("hex");
}

export async function processSemanticSimilarity(resumeText, jobDescription) {
  if (!jobDescription || jobDescription.trim().length <= 10) return 0;

  try {
    const jdHash = generateJDHash(jobDescription);
    let jdVector = null;

    const existingRows = await queryAsync(
      "SELECT embedding FROM job_embeddings WHERE job_hash = ?",
      [jdHash]
    );

    if (existingRows.length > 0) {
      console.log("⚡ JD Embedding found in cache!");
      const rawEmbedding = existingRows[0].embedding;
      jdVector = typeof rawEmbedding === "string" ? JSON.parse(rawEmbedding) : rawEmbedding;
    } else {
      console.log("🔍 JD Embedding not found. Generating via Gemini API...");
    }

    const [resumeEmbeddingResponse, jdEmbeddingResponse] = await Promise.all([
      ai.models.embedContent({ model: "text-embedding-004", contents: resumeText }),
      jdVector ? Promise.resolve(null) : ai.models.embedContent({ model: "text-embedding-004", contents: jobDescription })
    ]);

    const vectorA = resumeEmbeddingResponse.embedding.values;
    let vectorB = jdVector;

    if (!vectorB && jdEmbeddingResponse) {
      vectorB = jdEmbeddingResponse.embedding.values;
      await queryAsync(
        "INSERT IGNORE INTO job_embeddings (job_hash, embedding) VALUES (?, ?)",
        [jdHash, JSON.stringify(vectorB)]
      );
      console.log("💾 New JD Embedding cached.");
    }

    return calculateCosineSimilarity(vectorA, vectorB);
  } catch (embedError) {
    console.error("⚠️ Embedding failure, fallback to default baseline:", embedError.message);
    return 0.5;
  }
}