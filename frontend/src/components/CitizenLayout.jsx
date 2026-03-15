import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, LayoutGrid, LogOut, HardHat, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { path: "/citizen", icon: LayoutGrid, label: "Projects" },
  { path: "/citizen/map", icon: MapPin, label: "Map View" },
];

export default function CitizenLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", fontFamily: "Outfit" }}>
      {/* Top navbar */}
      <nav style={{
        background: "var(--ink2)", borderBottom: "1px solid rgba(96,165,250,0.15)",
        padding: "0 24px", height: "56px", display: "flex", alignItems: "center", gap: "20px",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginRight: "12px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px", background: "#3b82f6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <HardHat size={16} color="white" />
          </div>
          <span style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "15px" }}>
            InfraPlan <span style={{ color: "#60a5fa" }}>Citizen</span>
          </span>
        </div>

        {/* Nav links */}
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "13px", fontWeight: 600, padding: "6px 12px", borderRadius: "8px",
              textDecoration: "none", transition: "all 0.15s",
              background: active ? "rgba(96,165,250,0.12)" : "transparent",
              color: active ? "#60a5fa" : "var(--text3)",
            }}>
              <Icon size={15} /> {label}
            </Link>
          );
        })}

        {/* Right: user + logout */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "IBM Plex Mono" }}>
              {user?.area} · Citizen
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px",
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: "8px", color: "#f87171", cursor: "pointer", fontSize: "12px",
            fontFamily: "Outfit",
          }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="grid-bg" style={{ minHeight: "calc(100vh - 56px)" }}>
        {children}
      </main>
    </div>
  );
}
