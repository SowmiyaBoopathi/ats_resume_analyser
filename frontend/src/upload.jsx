import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Upload() {
  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [experience, setExperience] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  // Pre-fill name if logged in
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ats_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.name) setName(user.name);
      }
    } catch {}
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "txt"].includes(ext)) {
      alert("Only PDF or TXT files are supported.");
      return;
    }
    setResumeFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) { alert("Please upload your resume!"); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("name", name);
      formData.append("job", job);
      formData.append("jobDescription", jobDesc);
      formData.append("experience", experience);

      const response = await axios.post("http://localhost:8081/evaluate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        navigate("/result", {
          state: {
            evaluation: response.data.evaluation,
            file: response.data.file,
            candidate: response.data.candidate,
          },
        });
      } else {
        throw new Error(response.data.error || "Evaluation failed");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-div">
        <h1>Smart Feedback for Your Dream Job</h1>
        <p>Upload your resume for an instant ATS score and improvement tips</p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">Candidate Name</label>
          <input className="inputs" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />

          <label className="label">Target Job Role</label>
          <select className="inputs" value={job} onChange={(e) => setJob(e.target.value)}>
            <option value="">Select a job role</option>
            <option>Full Stack Developer</option>
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
            <option>Mobile App Developer</option>
            <option>Software Engineer</option>
            <option>Data Engineer</option>
            <option>Data Analyst</option>
            <option>Data Scientist</option>
            <option>Machine Learning Engineer</option>
            <option>AI Engineer</option>
            <option>DevOps Engineer</option>
            <option>Cloud Engineer</option>
            <option>UI/UX Designer</option>
            <option>Cybersecurity Engineer</option>
            <option>QA / Test Engineer</option>
            <option>Product Manager</option>
          </select>

          <label className="label">
            Job Description <span className="label-optional">(Recommended — improves accuracy)</span>
          </label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the job description here for keyword matching and skill gap analysis..."
          />

          <label className="label">Years of Experience</label>
          <input className="inputs" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 2" min="0" max="50" />

          <label className="label">Upload Resume (PDF or TXT)</label>
          <div
            className={`drop-zone ${dragOver ? "drag-active" : ""} ${resumeFile ? "file-selected" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input").click()}
          >
            {resumeFile ? (
              <>
                <span className="drop-icon">✅</span>
                <span className="drop-text">{resumeFile.name}</span>
                <span className="drop-sub">Click to change file</span>
              </>
            ) : (
              <>
                <span className="drop-icon">📄</span>
                <span className="drop-text">Drag & drop your resume here</span>
                <span className="drop-sub">or click to browse — PDF or TXT only</span>
              </>
            )}
          </div>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.txt"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          <button className="btn" type="submit" disabled={loading || !resumeFile}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span> Analyzing Resume...
              </span>
            ) : (
              "Get ATS Score →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;