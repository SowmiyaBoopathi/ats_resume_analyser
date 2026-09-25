
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Score color helper
const getScoreColor = (score) => {
  if (score >= 75) return "score-high";
  if (score >= 50) return "score-medium";
  return "score-low";
};

// Score label helper
const getScoreLabel = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
};

// Circular score ring
const ScoreRing = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (score / 100) * circumference;

  const colorClass = getScoreColor(score);

  return (
    <div className="score-ring-wrapper">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e8ecf0"
          strokeWidth="10"
        />

        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={
            score >= 75
              ? "#22c55e"
              : score >= 50
              ? "#f59e0b"
              : "#ef4444"
          }
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{
            transition: "stroke-dashoffset 1s ease"
          }}
        />
      </svg>

      <div className="score-ring-inner">
        <span
          className={`score-ring-number ${colorClass}`}
        >
          {score}
        </span>

        <span className="score-ring-pct">
          / 100
        </span>

        <span
          className={`score-ring-label ${colorClass}`}
        >
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
};

// Breakdown bar
const BreakdownBar = ({
  label,
  score,
  max
}) => {
  const pct =
    max > 0
      ? Math.round((score / max) * 100)
      : 0;

  return (
    <div className="breakdown-bar-row">
      <div className="breakdown-bar-label">
        <span>{label}</span>

        <span className="breakdown-bar-score">
          {score}/{max}
        </span>
      </div>

      <div className="breakdown-bar-track">
        <div
          className="breakdown-bar-fill"
          style={{
            width: `${pct}%`,
            background:
              pct >= 70
                ? "#22c55e"
                : pct >= 45
                ? "#f59e0b"
                : "#ef4444"
          }}
        />
      </div>
    </div>
  );
};


function ResultPage() {

  const { state } = useLocation();

  const navigate = useNavigate();


  // Check whether evaluation data exists
  if (!state || !state.evaluation) {
    return (
      <div className="no-data">

        <div className="no-data-icon">
          📭
        </div>

        <h2>
          No evaluation data found
        </h2>

        <p>
          Please upload a resume to get your ATS analysis.
        </p>

        <button
          onClick={() => navigate("/upload")}
          className="primary-btn"
        >
          Go Back to Upload
        </button>

      </div>
    );
  }


  /*
  ========================================================
  GET DATA FROM UPLOAD PAGE
  ========================================================
  */

  const {
    evaluation,
    file,
    candidate,
    resumeText,
    jobDescription
  } = state;


  /*
  ========================================================
  SAFE EXTRACTION
  ========================================================
  */

  const score =
    typeof evaluation.overall_score === "number"
      ? evaluation.overall_score
      : 0;

  const summary =
    evaluation.summary ||
    "Analysis complete.";

  const strengths =
    Array.isArray(evaluation.strengths)
      ? evaluation.strengths
      : [];

  const improvements =
    Array.isArray(evaluation.improvements)
      ? evaluation.improvements
      : [];

  const missing =
    Array.isArray(evaluation.missing_keywords)
      ? evaluation.missing_keywords
      : [];

  const detectedSkills =
    Array.isArray(evaluation.detected_skills)
      ? evaluation.detected_skills
      : [];

  const breakdown =
    evaluation.breakdown || null;

  const similarity =
    typeof evaluation.semantic_similarity === "number"
      ? Math.round(
          evaluation.semantic_similarity * 100
        )
      : null;


  /*
  ========================================================
  BREAKDOWN LABELS
  ========================================================
  */

  const breakdownLabels = {
    keyword_match: "Keyword Match",
    skills: "Skills",
    sections: "Resume Sections",
    achievements: "Achievements",
    formatting: "Format & Links",
    contact: "Contact Info"
  };


  return (
    <div className="result-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="result-header">

        <h1>
          📊 ATS Resume Report
        </h1>

        {candidate?.name &&
          candidate.name !== "Not provided" && (

          <p className="result-subheader">

            for{" "}

            <strong>
              {candidate.name}
            </strong>

            {candidate.job &&
              candidate.job !== "Not specified"
              ? ` — targeting ${candidate.job}`
              : ""}

          </p>
        )}

      </div>


      <div className="result-body">


        {/* ==================================================
            LEFT COLUMN
        ================================================== */}

        <div className="result-left">


          {/* SCORE CARD */}

          <div
            className={`score-card ${getScoreColor(score)}-card`}
          >

            <ScoreRing
              score={score}
            />

            <div className="score-card-info">

              <p className="score-summary-text">
                {summary}
              </p>


              {similarity !== null && (

                <div className="similarity-badge">

                  🔗 {similarity}%
                  semantic similarity with
                  job description

                </div>

              )}


              <div className="meta-chips">

                {file && (

                  <span className="meta-chip">
                    📄 {file}
                  </span>

                )}


                {candidate?.experience &&
                  candidate.experience !== "Not specified" && (

                  <span className="meta-chip">
                    🗓 {candidate.experience} yrs exp
                  </span>

                )}

              </div>

            </div>

          </div>


          {/* SCORE BREAKDOWN */}

          {breakdown && (

            <div className="result-card">

              <h3 className="card-title">
                📈 Score Breakdown
              </h3>

              {Object.entries(
                breakdown
              ).map(([key, val]) => (

                <BreakdownBar
                  key={key}
                  label={
                    breakdownLabels[key] || key
                  }
                  score={val.score}
                  max={val.max}
                />

              ))}

            </div>

          )}


          {/* DETECTED SKILLS */}

          {detectedSkills.length > 0 && (

            <div className="result-card">

              <h3 className="card-title">

                🛠 Detected Skills
                {" "}
                ({detectedSkills.length})

              </h3>

              <div className="skills-grid">

                {detectedSkills.map(
                  (skill, index) => (

                    <span
                      key={index}
                      className="skill-chip"
                    >
                      {skill}
                    </span>

                  )
                )}

              </div>

            </div>

          )}

        </div>


        {/* ==================================================
            RIGHT COLUMN
        ================================================== */}

        <div className="result-right">


          {/* STRENGTHS */}

          <div className="result-card strengths-card">

            <h3 className="card-title">
              ✅ Strengths
            </h3>

            {strengths.length > 0 ? (

              <ul className="result-list">

                {strengths.map(
                  (strength, index) => (

                    <li
                      key={index}
                      className="result-list-item result-list-green"
                    >
                      {strength}
                    </li>

                  )
                )}

              </ul>

            ) : (

              <p className="empty-msg">
                No specific strengths identified.
                Add more detail to your resume.
              </p>

            )}

          </div>


          {/* IMPROVEMENTS */}

          <div className="result-card improvements-card">

            <h3 className="card-title">
              ⚠️ Needed Fixes
            </h3>

            {improvements.length > 0 ? (

              <ul className="result-list">

                {improvements.map(
                  (improvement, index) => (

                    <li
                      key={index}
                      className="result-list-item result-list-orange"
                    >
                      {improvement}
                    </li>

                  )
                )}

              </ul>

            ) : (

              <p className="empty-msg">
                No major improvements needed.
              </p>

            )}

          </div>


          {/* MISSING KEYWORDS */}

          {missing.length > 0 && (

            <div className="result-card keywords-card">

              <h3 className="card-title">
                🔍 Missing Keywords from Job Description
              </h3>

              <div className="keywords-grid">

                {missing.map(
                  (keyword, index) => (

                    <span
                      key={index}
                      className="keyword-chip"
                    >
                      {keyword}
                    </span>

                  )
                )}

              </div>

              <p className="keywords-hint">
                Add these to your resume where
                genuinely applicable.
              </p>

            </div>

          )}


          {/* QUICK TIP */}

          <div className="result-card tip-card">

            <h3 className="card-title">
              💡 Quick Tip
            </h3>

            <p>

              {score < 50

                ? "Focus on adding a professional summary, quantifiable achievements (numbers!), and ensuring all key sections are present."

                : score < 75

                ? "You're on the right track. Tailor your keywords to the job description and add measurable impact to each bullet point."

                : "Your resume is well-optimized. Keep it updated and tailor the skills section for each specific role."

              }

            </p>

          </div>

        </div>

      </div>


      {/* ==================================================
          ACTION BUTTONS
      ================================================== */}

      <div className="result-actions">

        <button
          onClick={() =>
            navigate("/resume-generator", {
              state: {
                resumeText,
                jobDescription,
                missingKeywords: missing,
                candidate
              }
            })
          }
          className="primary-btn"
        >
          Generate ATS-Friendly Resume
        </button>


        <button
          onClick={() =>
            navigate("/upload")
          }
          className="secondary-btn"
        >
          📝 Analyze Another Resume
        </button>


        <button
          onClick={() =>
            navigate("/")
          }
          className="secondary-btn"
        >
          🏠 Back to Home
        </button>

      </div>

    </div>
  );
}

export default ResultPage;

