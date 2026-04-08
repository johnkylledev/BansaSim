import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import Results from "@/pages/Results";
import References from "@/pages/References";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />
        <Route
          path="/results"
          element={
            <AppShell>
              <Results />
            </AppShell>
          }
        />
        <Route
          path="/references"
          element={
            <AppShell>
              <References />
            </AppShell>
          }
        />
      </Routes>
    </Router>
  );
}
