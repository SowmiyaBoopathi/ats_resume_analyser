import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./login";
import Signup from "./signup";
import Home from "./home";
import Upload from "./upload";
import Resultpage from "./Resultpage";
import ResumeGenerator from "./ResumeGenerator";

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/upload" element={<Upload />} />

        <Route path="/result" element={<Resultpage />} />

        <Route
          path="/resume-generator"
          element={<ResumeGenerator />}
        />

      </Routes>
    </Router>
  );
}

export default App;