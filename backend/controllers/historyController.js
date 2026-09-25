import db from "../config/db.js";

export const getUserHistory = async (req, res) => {
  const { email } = req.params;

  if (req.user.email !== email) {
    return res.status(403).json({ error: "Unauthorized access to requested user history." });
  }

  const fetchQuery = `
    SELECT id, target_job, overall_score, file_name, created_at, evaluation_json
    FROM evaluations
    WHERE user_email = ?
    ORDER BY created_at DESC
  `;

  try {
    const [results] = await db.query(fetchQuery, [email]);

    const formattedHistory = results.map((row) => ({
      id: row.id,
      target_job: row.target_job,
      overall_score: row.overall_score,
      file_name: row.file_name,
      created_at: row.created_at,
      evaluation: typeof row.evaluation_json === "string" ? JSON.parse(row.evaluation_json) : row.evaluation_json
    }));

    return res.status(200).json({ success: true, history: formattedHistory });
  } catch (error) {
    console.error("History retrieval error:", error.message);
    return res.status(500).json({ error: "Database retrieval failure" });
  }
};