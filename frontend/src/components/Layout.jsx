import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, BarChart3, Database, MessageSquare, HardHat, Cpu, Map, CloudRain, LogOut, ShieldCheck } from "lucide-react";
import useStore from "../store/useStore.js";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/new", icon: Plus, label: "New Project" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/map", icon: Map, label: "Map View" },
  { path: "/weather", icon: CloudRain, label: "Weather Risk" },
  { path: "/data", icon: Database, label: "Data Sources" },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleChat, modelStatus } = useStore();
  const { user, logout } = useAuth();

  const engineLabel = {
    "phi3-online": { text: "Phi-3 Live", color: "#4ade80" },
    "phi3-loading": { text: "Phi-3 Loading", color: "#facc15" },
    "rule-based": { text: "Rule Engine", color: "#ffb72b" },
  }[modelStatus?.engine] || { text: "Connecting…", color: "#5a5753" };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink)" }}>
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: "var(--ink2)", borderRight: "1px solid var(--border)" }}>
        <div className="p-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--amber)", boxShadow: "0 0 16px rgba(255,183,43,0.4)" }}>
              <HardHat size={18} color="#0e0f0f" />
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: "var(--text)", fontFamily: "Syne" }}>
                InfraPlan<span style={{ color: "var(--amber)" }}> AI</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: "#ffb72b", fontFamily: "IBM Plex Mono" }}>
                <ShieldCheck size={10} /> Admin Portal
              </div>
            </div>
          </div>
          {user && (
            <div className="mt-3 px-2 py-1.5 rounded-lg text-xs" style={{ background: "var(--amber-glow)", color: "var(--text2)" }}>
              👤 {user.name} · {user.dept}
            </div>
          )}
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--ink3)", border: "1px solid var(--border)" }}>
            <Cpu size={12} style={{ color: engineLabel.color }} />
            <span className="text-xs font-medium" style={{ color: engineLabel.color, fontFamily: "IBM Plex Mono" }}>{engineLabel.text}</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full dot-pulse" style={{ background: engineLabel.color }} />
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium"
                style={{
                  background: active ? "var(--amber-glow)" : "transparent",
                  color: active ? "var(--amber)" : "var(--text2)",
                  borderLeft: active ? "2px solid var(--amber)" : "2px solid transparent",
                }}>
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={toggleChat} className="btn btn-ghost w-full justify-center" style={{ color: "var(--amber)", borderColor: "var(--border2)" }}>
            <MessageSquare size={15} /> InfraBot Chat
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all"
            style={{ background: "rgba(248,113,113,0.07)", color: "#f87171", border: "1px solid rgba(248,113,113,0.15)", cursor: "pointer", fontFamily: "Outfit" }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto grid-bg">{children}</main>
    </div>
  );
}
