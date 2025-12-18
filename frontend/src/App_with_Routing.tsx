
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import CaseModels from "./components/casemodels";

export function WrappedApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/case-models" element={<CaseModels />} />
      </Routes>
    </Router>
  );
}
