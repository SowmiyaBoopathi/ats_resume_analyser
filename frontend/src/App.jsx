import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from './login';
import Signup from './signup';
import Home from './homeome';
import Upload from "./upload";
import Resultpage from './Resultpage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/result" element={<Resultpage />} />
      </Routes>
    </Router>
  );
}

export default App;