import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const str = { type: "STRING" };
const list = { type: "ARRAY", items: str };

const obj = (properties) => ({
  type: "OBJECT",
  properties,
  required: Object.keys(properties),
});

const schema = {
  type: "OBJECT",
  properties: {
    name: str,
    email: str,
    phone: str,
    links: list,
    objective: str,
    skills: { type: "ARRAY", items: obj({ category: str, items: str }) },
    experience: {
      type: "ARRAY",
      items: obj({ title: str, company: str, duration: str, points: list }),
    },
    projects: {
      type: "ARRAY",
      items: obj({ name: str, tech: str, points: list }),
    },
    education: {
      type: "ARRAY",
      items: obj({ degree: str, institution: str, year: str }),
    },
    certifications: list,
  },
  required: ["name", "objective", "skills", "experience", "education"],
};

export const generateATSResume = async ({
  resumeText,
  jobDescription = "",
  confirmedSkills = [],
}) => {
  const prompt = `
You are an expert ATS resume writer. Rewrite the candidate's resume for the target job.

Rules:
1. Use only facts from the original resume. Do not invent experience, projects, education or certifications.
2. Confirmed skills are skills the candidate says they have. Put every one of them in the skills section.
3. Keep the objective to two lines.
4. Group skills into categories (Programming, Web, Databases, Tools, etc.).
5. Write experience and project points as short achievement statements and keep any numbers from the original.

ORIGINAL RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription || "Not provided"}

CONFIRMED SKILLS:
${JSON.stringify(confirmedSkills)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const resume = JSON.parse(response.text);

  // make sure every confirmed skill made it into the resume
  const listed = resume.skills.map((s) => s.items.toLowerCase()).join(",");
  const left = confirmedSkills.filter((s) => !listed.includes(s.toLowerCase()));

  if (left.length) {
    resume.skills.push({ category: "Additional", items: left.join(", ") });
  }

  return resume;
};