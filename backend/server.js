import express from "express";
import mysql from "mysql";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import * as pdfParseLib from "pdf-parse";

const pdfParse = pdfParseLib.default || pdfParseLib;

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

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
      (err) => {
        if (err?.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "Email already registered!" });
        if (err) return res.status(500).json({ message: "Server error during signup." });
        res.status(201).json({ message: "Account created successfully!" });
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
      res.status(200).json({ message: "Login successful!", user: userInfo });
    } catch {
      res.status(500).json({ message: "Server error during authentication." });
    }
  });
});

// -------------------- PDF Parser --------------------
const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// ==================== SCORING ENGINE ====================

// All important tech & soft skills with aliases
const SKILL_MAP = {
  // Languages
  Python: ["python"],
  JavaScript: ["javascript", "js", "es6", "es2015", "es2016", "es2017"],
  TypeScript: ["typescript", "ts"],
  Java: ["java"],
  "C++": ["c++", "cpp"],
  "C#": ["c#", "csharp"],
  PHP: ["php"],
  Ruby: ["ruby"],
  Go: ["golang", " go "],
  Swift: ["swift"],
  Kotlin: ["kotlin"],
  Rust: ["rust"],
  Scala: ["scala"],
  R: [" r programming", "r language", "rlang"],
  MATLAB: ["matlab"],
  // Frontend
  React: ["react", "reactjs", "react.js"],
  Angular: ["angular", "angularjs"],
  Vue: ["vue", "vuejs", "vue.js"],
  "Next.js": ["next.js", "nextjs"],
  "Nuxt.js": ["nuxt.js", "nuxtjs"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3", "scss", "sass", "less", "tailwind", "bootstrap"],
  jQuery: ["jquery"],
  Redux: ["redux", "redux-toolkit", "zustand", "recoil"],
  // Backend
  "Node.js": ["node.js", "nodejs", "node "],
  Express: ["express", "expressjs"],
  Django: ["django"],
  Flask: ["flask"],
  FastAPI: ["fastapi"],
  Spring: ["spring boot", "spring mvc", "spring framework"],
  Laravel: ["laravel"],
  Rails: ["rails", "ruby on rails"],
  GraphQL: ["graphql"],
  REST: ["rest api", "restful", "rest "],
  // Databases
  SQL: ["sql"],
  MySQL: ["mysql"],
  PostgreSQL: ["postgresql", "postgres"],
  MongoDB: ["mongodb", "mongo"],
  Redis: ["redis"],
  Firebase: ["firebase"],
  Elasticsearch: ["elasticsearch"],
  DynamoDB: ["dynamodb"],
  Cassandra: ["cassandra"],
  // Cloud & DevOps
  AWS: ["aws", "amazon web services", "ec2", "s3", "lambda"],
  Azure: ["azure", "microsoft azure"],
  GCP: ["gcp", "google cloud", "google cloud platform"],
  Docker: ["docker", "containerization"],
  Kubernetes: ["kubernetes", "k8s"],
  Jenkins: ["jenkins", "ci/cd", "continuous integration"],
  Terraform: ["terraform"],
  Ansible: ["ansible"],
  Git: ["git"],
  GitHub: ["github"],
  GitLab: ["gitlab"],
  Linux: ["linux", "unix", "bash", "shell scripting"],
  // Data & ML
  TensorFlow: ["tensorflow"],
  PyTorch: ["pytorch"],
  "Scikit-learn": ["scikit-learn", "sklearn"],
  Pandas: ["pandas"],
  NumPy: ["numpy"],
  "Machine Learning": ["machine learning", "ml model", "supervised learning", "unsupervised learning"],
  "Deep Learning": ["deep learning", "neural network", "cnn", "rnn", "lstm", "transformer"],
  NLP: ["nlp", "natural language processing", "text classification", "named entity"],
  "Computer Vision": ["computer vision", "image recognition", "object detection", "opencv"],
  MLOps: ["mlops", "model deployment", "model monitoring"],
  "Data Science": ["data science", "data analysis", "data visualization"],
  // Testing
  Jest: ["jest"],
  Mocha: ["mocha"],
  Cypress: ["cypress"],
  Selenium: ["selenium"],
  Pytest: ["pytest"],
  // Methodologies
  Agile: ["agile"],
  Scrum: ["scrum"],
  Kanban: ["kanban"],
  DevOps: ["devops"],
  // Soft skills
  Leadership: ["leadership", "led team", "team lead", "managed team"],
  Communication: ["communication", "presented", "stakeholder"],
  "Problem Solving": ["problem solving", "troubleshooting", "debugging"],
  Teamwork: ["teamwork", "collaboration", "cross-functional"],
  "Project Management": ["project management", "pmp", "jira", "confluence"],
};

const extractSkills = (text) => {
  const lower = text.toLowerCase();
  return Object.entries(SKILL_MAP)
    .filter(([, aliases]) => aliases.some((a) => lower.includes(a)))
    .map(([skill]) => skill);
};

const extractAchievements = (text) => {
  const patterns = [
    /\d+\s*%/g,
    /\$\s*[\d,]+(\.\d+)?\s*(k|m|b)?/gi,
    /\d+\s*x\s*(faster|improvement|growth)/gi,
    /increased\s+\w+\s+by\s+\d+/gi,
    /reduced\s+\w+\s+by\s+\d+/gi,
    /improved\s+\w+\s+by\s+\d+/gi,
    /saved\s+\$?[\d,]+/gi,
    /generated\s+\$?[\d,]+/gi,
    /led\s+(?:a\s+)?\d+[\s-](?:person|member|engineer)/gi,
    /managed\s+\$?[\d,]+/gi,
    /deployed\s+\d+/gi,
    /served\s+\d+[\s+](?:users|customers|clients)/gi,
    /\d+\+?\s+(?:users|customers|clients|downloads|requests)/gi,
  ];
  const found = [];
  patterns.forEach((p) => {
    const m = text.match(p);
    if (m) found.push(...m);
  });
  return [...new Set(found)];
};

const detectSections = (text) => {
  const lower = text.toLowerCase();
  return {
    experience: /work experience|professional experience|employment history|work history/i.test(text),
    education: /education|academic|degree|bachelor|master|phd|b\.?sc|m\.?sc/i.test(text),
    skills: /skills|technical skills|competencies|technologies|tech stack/i.test(text),
    contact: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text) || /\b\d{10}\b|\+\d{1,3}[\s-]\d/.test(text),
    summary: /summary|profile|objective|about me|professional summary/i.test(text),
    projects: /projects|personal projects|academic projects|portfolio/i.test(text),
    certifications: /certification|certified|certificate|license|credential/i.test(text),
    linkedin: /linkedin\.com|linkedin/i.test(lower),
    github: /github\.com|github/i.test(lower),
  };
};

// Count years of experience mentioned
const extractExperienceYears = (text) => {
  const matches = text.match(/(\d+)\+?\s+years?\s+(?:of\s+)?(?:experience|exp)/gi) || [];
  if (!matches.length) return 0;
  const nums = matches.map((m) => parseInt(m.match(/\d+/)[0]));
  return Math.max(...nums);
};

// ---- Main scoring function ----
// Score breakdown (100 total):
//   Keywords vs JD : 35 pts
//   Skills present : 20 pts
//   Sections       : 15 pts
//   Achievements   : 15 pts
//   Formatting cues: 10 pts
//   Contact info   :  5 pts

const scoreResume = (resumeText, jobDescription = "") => {
  const sections = detectSections(resumeText);
  const resumeSkills = extractSkills(resumeText);
  const achievements = extractAchievements(resumeText);
  const wordCount = resumeText.trim().split(/\s+/).length;

  let breakdown = {
    keyword_match: 0,
    skills: 0,
    sections: 0,
    achievements: 0,
    formatting: 0,
    contact: 0,
  };

  // 1. Keyword match vs job description (35 pts)
  if (jobDescription && jobDescription.trim().length > 10) {
    const jdWords = new Set(
      jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    );
    const resumeWords = new Set(
      resumeText.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    );
    const stopWords = new Set(["the", "and", "for", "are", "that", "with", "this", "will", "have", "from", "not", "you", "all", "can", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new", "now", "own", "see", "two", "who", "did", "let", "put", "say", "she", "too", "use"]);
    const meaningfulJdWords = [...jdWords].filter((w) => !stopWords.has(w) && w.length > 3);
    if (meaningfulJdWords.length > 0) {
      const matched = meaningfulJdWords.filter((w) => resumeWords.has(w));
      breakdown.keyword_match = Math.round((matched.length / meaningfulJdWords.length) * 35);
    }
  } else {
    breakdown.keyword_match = 20; // neutral baseline when no JD
  }

  // 2. Skills (20 pts) — more unique skills = higher score
  breakdown.skills = Math.min(resumeSkills.length * 1.5, 20);

  // 3. Sections (15 pts)
  let sectionScore = 0;
  if (sections.experience) sectionScore += 4;
  if (sections.education) sectionScore += 3;
  if (sections.skills) sectionScore += 3;
  if (sections.summary) sectionScore += 2;
  if (sections.projects) sectionScore += 1.5;
  if (sections.certifications) sectionScore += 1.5;
  breakdown.sections = Math.min(sectionScore, 15);

  // 4. Achievements (15 pts)
  breakdown.achievements = Math.min(achievements.length * 3, 15);

  // 5. Formatting cues (10 pts)
  let formatScore = 0;
  if (wordCount >= 200 && wordCount <= 900) formatScore += 4; // ideal length
  else if (wordCount >= 150) formatScore += 2;
  if (sections.github || sections.linkedin) formatScore += 3;
  if (extractExperienceYears(resumeText) > 0) formatScore += 1;
  const actionVerbs = ["developed", "built", "designed", "implemented", "led", "managed", "created", "optimized", "improved", "delivered", "deployed", "architected", "collaborated", "automated", "launched"];
  const usedVerbs = actionVerbs.filter((v) => new RegExp(`\\b${v}`, "i").test(resumeText));
  formatScore += Math.min(usedVerbs.length * 0.4, 2);
  breakdown.formatting = Math.min(formatScore, 10);

  // 6. Contact info (5 pts)
  if (sections.contact) breakdown.contact = 5;

  const total = Math.round(
    breakdown.keyword_match +
    breakdown.skills +
    breakdown.sections +
    breakdown.achievements +
    breakdown.formatting +
    breakdown.contact
  );

  return {
    overall_score: Math.max(5, Math.min(100, total)),
    breakdown: {
      keyword_match: { score: Math.round(breakdown.keyword_match), max: 35 },
      skills: { score: Math.round(breakdown.skills), max: 20 },
      sections: { score: Math.round(breakdown.sections), max: 15 },
      achievements: { score: Math.round(breakdown.achievements), max: 15 },
      formatting: { score: Math.round(breakdown.formatting), max: 10 },
      contact: { score: Math.round(breakdown.contact), max: 5 },
    },
  };
};

// Semantic similarity (Jaccard)
const semanticSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  const set1 = new Set(text1.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
  const set2 = new Set(text2.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
  if (!set1.size || !set2.size) return 0;
  const intersection = [...set1].filter((x) => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  return parseFloat((intersection / union).toFixed(2));
};

// Strengths
const buildStrengths = (resumeText, jobDescription, resumeSkills, sections, achievements) => {
  const strengths = [];

  if (sections.experience) strengths.push("Clear work experience section present");
  if (sections.education) strengths.push("Education background is documented");
  if (sections.skills) strengths.push("Dedicated skills section found");
  if (sections.summary) strengths.push("Professional summary included");
  if (sections.projects) strengths.push("Projects section showcases practical work");
  if (sections.certifications) strengths.push("Certifications add credibility");
  if (achievements.length >= 3) strengths.push(`${achievements.length} quantifiable achievements detected`);
  else if (achievements.length > 0) strengths.push(`${achievements.length} metric(s) found — good start`);
  if (sections.github) strengths.push("GitHub profile linked — great for tech roles");
  if (sections.linkedin) strengths.push("LinkedIn profile included");

  if (jobDescription && jobDescription.trim().length > 10) {
    const jdSkills = extractSkills(jobDescription);
    const matched = jdSkills.filter((s) => resumeSkills.includes(s));
    if (matched.length > 0)
      strengths.push(`${matched.length} job-required skill(s) found: ${matched.slice(0, 4).join(", ")}`);
  } else if (resumeSkills.length > 5) {
    strengths.push(`${resumeSkills.length} technical skills detected`);
  }

  return strengths.slice(0, 6);
};

// Missing skills
const buildMissingSkills = (resumeText, jobDescription) => {
  if (!jobDescription || jobDescription.trim().length < 10)
    return [];

  const resumeSkills = new Set(extractSkills(resumeText));
  const jdSkills = extractSkills(jobDescription);
  const missing = jdSkills.filter((s) => !resumeSkills.has(s));

  // Also find important JD keywords not in resume
  const jdWords = (jobDescription.toLowerCase().match(/\b[a-z]{5,}\b/g) || [])
    .filter((w) => !resumeText.toLowerCase().includes(w))
    .slice(0, 5)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  return [...new Set([...missing, ...jdWords])].slice(0, 10);
};

// Improvements
const buildImprovements = (resumeText, jobDescription, sections, achievements, resumeSkills) => {
  const improvements = [];
  const wordCount = resumeText.trim().split(/\s+/).length;

  if (!sections.summary)
    improvements.push("Add a professional summary (2–3 lines) at the top of your resume");
  if (!sections.experience)
    improvements.push("Add a Work Experience section with role, company, and dates");
  if (!sections.skills)
    improvements.push("Add a dedicated Skills section — ATS scans for this specifically");
  if (!sections.projects)
    improvements.push("Add a Projects section to demonstrate hands-on experience");
  if (achievements.length < 3)
    improvements.push("Include more numbers — e.g. 'Improved performance by 30%' or 'Served 10k+ users'");
  if (wordCount < 200)
    improvements.push("Resume is too short. Aim for 300–600 words with detailed descriptions");
  else if (wordCount > 900)
    improvements.push("Resume is too long. Trim to 1–2 pages for best ATS results");
  if (!sections.github && !sections.linkedin)
    improvements.push("Add GitHub and LinkedIn profile links");
  if (jobDescription && jobDescription.trim().length > 10) {
    const missing = buildMissingSkills(resumeText, jobDescription);
    if (missing.length > 0)
      improvements.push(`Add missing keywords from the job description: ${missing.slice(0, 4).join(", ")}`);
  }

  const actionVerbs = ["developed", "built", "designed", "implemented", "led", "managed", "optimized"];
  const hasActionVerbs = actionVerbs.some((v) => new RegExp(`\\b${v}`, "i").test(resumeText));
  if (!hasActionVerbs)
    improvements.push("Use strong action verbs: Built, Developed, Designed, Optimized, Led, Delivered");

  return improvements.slice(0, 7);
};

// Summary text
const buildSummary = (score, hasJD) => {
  if (!hasJD) {
    if (score >= 70) return "Strong resume! Add a job description for targeted keyword analysis.";
    if (score >= 50) return "Good foundation. Add a job description to see how well you match.";
    return "Resume needs improvement. Add a job description for full analysis.";
  }
  if (score >= 85) return "Excellent match! Your resume is highly optimized for this role.";
  if (score >= 70) return "Strong candidate. Minor tweaks will make you stand out further.";
  if (score >= 55) return "Good potential. Address the missing keywords and improvements below.";
  if (score >= 40) return "Moderate match. Significant improvements will boost your chances.";
  return "Low alignment. Follow the improvement suggestions to strengthen your application.";
};

// ==================== /evaluate ENDPOINT ====================
app.post("/evaluate", upload.single("resume"), async (req, res) => {
  const { jobDescription, name, job, experience } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No resume file uploaded." });

  const filePath = file.path;

  try {
    const ext = file.originalname.split(".").pop().toLowerCase();
    let resumeText = "";

    if (ext === "pdf") resumeText = await extractTextFromPDF(filePath);
    else if (ext === "txt") resumeText = fs.readFileSync(filePath, "utf8");
    else return res.status(400).json({ error: "Unsupported file type. Upload PDF or TXT only." });

    if (!resumeText || resumeText.trim().length < 50)
      return res.status(400).json({ error: "Resume text is too short or could not be extracted." });

    // Run scoring engine
    const { overall_score, breakdown } = scoreResume(resumeText, jobDescription);
    const resumeSkills = extractSkills(resumeText);
    const sections = detectSections(resumeText);
    const achievements = extractAchievements(resumeText);

    const strengths = buildStrengths(resumeText, jobDescription, resumeSkills, sections, achievements);
    const missing_keywords = buildMissingSkills(resumeText, jobDescription);
    const improvements = buildImprovements(resumeText, jobDescription, sections, achievements, resumeSkills);
    const summary = buildSummary(overall_score, !!(jobDescription && jobDescription.trim().length > 10));
    const similarity = semanticSimilarity(resumeText, jobDescription);

    const evaluation = {
      overall_score,           // ← always a number, never undefined
      semantic_similarity: similarity,
      breakdown,
      strengths,
      improvements,
      missing_keywords,
      detected_skills: resumeSkills,
      summary,
    };

    res.status(200).json({
      success: true,
      evaluation,
      file: file.originalname,
      candidate: {
        name: name || "Not provided",
        job: job || "Not specified",
        experience: experience || "Not specified",
      },
    });

  } catch (err) {
    console.error("❌ Evaluation Error:", err.message);
    res.status(500).json({ error: "Failed to evaluate resume. Please try again." });
  } finally {
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
  }
});

// ==================== /analyze (alias of /evaluate) ====================
app.post("/analyze", upload.single("resume"), async (req, res) => {
  req.url = "/evaluate";
  app._router.handle(req, res, () => {});
});

// -------------------- Change Password --------------------
app.post("/change-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword)
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

// -------------------- Health --------------------
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "ATS Resume Analyzer", version: "4.0", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 ATS Resume Analyzer v4.0`);
  console.log(`🌐 http://localhost:${PORT}/health\n`);
});