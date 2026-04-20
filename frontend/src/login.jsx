import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8081/login", { email, password });
      // Store user info in sessionStorage so Upload page knows who is logged in
      sessionStorage.setItem("ats_user", JSON.stringify(res.data.user));
      navigate("/upload");
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="big-container">
      <h1 className="auth-title">Welcome Back</h1>
      <p className="auth-sub">Log in to unlock your professional path</p>
      <form className="containers" onSubmit={handleSubmit}>
        <label className="label">Email Address</label>
        <input className="input" onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" type="email" required />

        <label className="label">Password</label>
        <input className="input" onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" type="password" required />

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="auth-footer-text">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;