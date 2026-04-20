import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pass1 !== pass2) {
      alert("Passwords don't match. Please make sure both are the same.");
      return;
    }
    if (pass1.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8081/signup", { name, email, password: pass1 });
      // Auto login — store basic info
      sessionStorage.setItem("ats_user", JSON.stringify({ name, email }));
      navigate("/upload");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="big-container" style={{ marginTop: "30px" }}>
      <h1 className="auth-title">Create Account</h1>
      <p className="auth-sub">Sign up to start your professional journey</p>

      <form className="containers" onSubmit={handleSubmit}>
        <label className="label">Full Name</label>
        <input className="input" onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" type="text" required />

        <label className="label">Email Address</label>
        <input className="input" onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" type="email" required />

        <label className="label">Password</label>
        <input className="input" value={pass1} onChange={(e) => setPass1(e.target.value)} placeholder="Min. 6 characters" type="password" required />

        <label className="label">Confirm Password</label>
        <input className="input" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="Repeat your password" type="password" required />

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;