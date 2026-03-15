import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Layouts
import Layout from "./components/Layout.jsx";
import CitizenLayout from "./components/CitizenLayout.jsx";

// ── Admin pages (all inside pages/admin/) ────────────────────────────────────
import Dashboard       from "./pages/admin/Dashboard.jsx";
import NewProject      from "./pages/admin/NewProject.jsx";
import ProjectDetail   from "./pages/admin/ProjectDetail.jsx";
import TaskGraph       from "./pages/admin/TaskGraph.jsx";
import Analytics       from "./pages/admin/Analytics.jsx";
import DataSources     from "./pages/admin/DataSources.jsx";
import BudgetTracker   from "./pages/admin/BudgetTracker.jsx";
import DelayPrediction from "./pages/admin/DelayPrediction.jsx";
import AdminMapView    from "./pages/admin/AdminMapView.jsx";
import AdminWeather    from "./pages/admin/AdminWeather.jsx";

// ── Citizen pages (all inside pages/citizen/) ────────────────────────────────
import CitizenHome     from "./pages/citizen/CitizenHome.jsx";
import CitizenProject  from "./pages/citizen/CitizenProject.jsx";
import CitizenMapView  from "./pages/citizen/CitizenMapView.jsx";

// ── Public ───────────────────────────────────────────────────────────────────
import Login   from "./pages/Login.jsx";
import ChatBot from "./components/ChatBot.jsx";
import useStore from "./store/useStore.js";

// ── Route guards ─────────────────────────────────────────────────────────────
function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/citizen" replace />;
  return children;
}

function CitizenRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── App routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user, isAdmin } = useAuth();
  const fetchModelStatus = useStore((s) => s.fetchModelStatus);
  useEffect(() => { fetchModelStatus(); }, []);

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to={isAdmin ? "/" : "/citizen"} />} />

        {/* ── Admin ── */}
        <Route path="/"                       element={<AdminRoute><Layout><Dashboard /></Layout></AdminRoute>} />
        <Route path="/new"                    element={<AdminRoute><Layout><NewProject /></Layout></AdminRoute>} />
        <Route path="/project/:id"            element={<AdminRoute><Layout><ProjectDetail /></Layout></AdminRoute>} />
        <Route path="/project/:id/graph"      element={<AdminRoute><TaskGraph /></AdminRoute>} />
        <Route path="/project/:id/budget"     element={<AdminRoute><Layout><BudgetTracker /></Layout></AdminRoute>} />
        <Route path="/project/:id/delay"      element={<AdminRoute><Layout><DelayPrediction /></Layout></AdminRoute>} />
        <Route path="/analytics"              element={<AdminRoute><Layout><Analytics /></Layout></AdminRoute>} />
        <Route path="/data"                   element={<AdminRoute><Layout><DataSources /></Layout></AdminRoute>} />
        <Route path="/map"                    element={<AdminRoute><Layout><AdminMapView /></Layout></AdminRoute>} />
        <Route path="/weather"                element={<AdminRoute><Layout><AdminWeather /></Layout></AdminRoute>} />

        {/* ── Citizen ── */}
        <Route path="/citizen"                element={<CitizenRoute><CitizenLayout><CitizenHome /></CitizenLayout></CitizenRoute>} />
        <Route path="/citizen/project/:id"    element={<CitizenRoute><CitizenLayout><CitizenProject /></CitizenLayout></CitizenRoute>} />
        <Route path="/citizen/map"            element={<CitizenRoute><CitizenLayout><CitizenMapView /></CitizenLayout></CitizenRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? (isAdmin ? "/" : "/citizen") : "/login"} />} />
      </Routes>

      {user && <ChatBot />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
