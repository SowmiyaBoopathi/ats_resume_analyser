import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function evaluateResumeWithAI(resumeText, jobDescription, job, experience) {
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

  return JSON.parse(response.text);
}

export async function testGeminiConnection() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Respond with exactly the words: 'Gemini pipeline is working! ✅'",
  });
  return response.text.trim();
}