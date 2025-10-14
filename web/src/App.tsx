import { Routes, Route } from "react-router-dom";
import SiteLayout from "./components/layout/SiteLayout";
import Home from "./pages/Home";
import Companies from "./pages/Companies";
import CaseModels from "./pages/CaseModels"; // existing file
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="companies" element={<Companies />} />
        <Route path="case-models" element={<CaseModels />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
