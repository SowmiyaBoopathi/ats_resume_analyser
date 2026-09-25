import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { downloadResumePdf, resumeToText } from "./resumePdf";

function ResumeGenerator() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [selected, setSelected] = useState([]);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!state?.resumeText) {
    return (
      <div className="no-data">
        <h2>No resume data found</h2>
        <p>Please analyze a resume first.</p>
        <button className="primary-btn" onClick={() => navigate("/upload")}>
          Go to Upload
        </button>
      </div>
    );
  }

  const { resumeText, jobDescription, missingKeywords = [] } = state;

  const toggleSkill = (skill) => {
    setSelected((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const generate = async () => {
    setLoading(true);

    try {
      const token = sessionStorage.getItem("ats_token");

      const res = await axios.post(
        "http://localhost:8081/generate-resume",
        { resumeText, jobDescription, confirmedSkills: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResume(res.data.resume);
    } catch (err) {
      alert(err.response?.data?.error || "Could not generate the resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-generator-page">
      <div className="resume-generator-card">
        <h1>ATS-Friendly Resume</h1>

        {!resume ? (
          <>
            {missingKeywords.length > 0 ? (
              <>
                <p>Do you have any of these skills? Select the ones you know.</p>

                <div className="skill-selection-list">
                  {missingKeywords.map((skill) => (
                    <label key={skill} className="skill-selection-item">
                      <input
                        type="checkbox"
                        checked={selected.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                      />
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="no-skills-message">
                No missing skills found. You can generate your resume directly.
              </p>
            )}

            <div className="generator-actions">
              <button
                className="primary-btn"
                onClick={generate}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Resume"}
              </button>

              <button className="secondary-btn" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="generated-resume">
              <pre>{resumeToText(resume)}</pre>
            </div>

            <div className="generator-actions">
              <button
                className="primary-btn"
                onClick={() => downloadResumePdf(resume)}
              >
                Download PDF
              </button>

              <button className="secondary-btn" onClick={() => setResume(null)}>
                Change Skills
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResumeGenerator;