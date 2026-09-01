import dbPool from "../config/db.js";

export const getUserHistory = (req, res) => {
  const { email } = req.params;

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
      console.error("❌ JSON parsing error:", parseErr.message);
      res.status(500).json({ error: "Data corruption error during compilation." });
    }
  });
};