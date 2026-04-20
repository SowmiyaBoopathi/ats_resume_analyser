import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      <nav className="navbar">
        <div className="div-container">
          <span className="brand-logo">InterviewReady</span>
          <div className="nav-links">
            <Link to="/login" className="nav-btn-outline">Login</Link>
            <Link to="/signup" className="nav-btn-filled">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="hero-section">
        <div className="hero-badge">AI-Powered Resume Analysis</div>
        <h1 className="hero-title">Know Where Your Resume<br />Stands Among the Rest</h1>
        <p className="hero-text">
          Upload your resume and get instant feedback with detailed ATS scoring,
          skill gap analysis, and actionable improvement tips.
        </p>
        <Link to="/login" className="hero-button">Analyze Your Resume →</Link>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h2>ATS Score</h2>
          <p>Get a detailed breakdown of your resume score across 6 key categories including keywords, skills, and achievements.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h2>Skill Gap Analysis</h2>
          <p>See exactly which skills from the job description are missing from your resume and what to add.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💡</div>
          <h2>Smart Improvements</h2>
          <p>Receive up to 7 prioritized improvement suggestions tailored to your resume and target role.</p>
        </div>
      </div>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step"><span className="step-num">1</span><p>Upload your PDF or TXT resume</p></div>
          <div className="step-arrow">→</div>
          <div className="step"><span className="step-num">2</span><p>Paste the job description (optional)</p></div>
          <div className="step-arrow">→</div>
          <div className="step"><span className="step-num">3</span><p>Get your detailed ATS report</p></div>
        </div>
        <Link to="/login" className="how-it-works-button">Get Started Free</Link>
      </div>

      <footer className="footer">
        &copy; {new Date().getFullYear()} InterviewReady. All rights reserved.
      </footer>
    </>
  );
}

export default Home;