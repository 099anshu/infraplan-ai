import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { HardHat, ShieldCheck, Users, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // "admin" | "citizen"
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 600)); // slight delay for feel
    const result = login(form.username, form.password);
    setLoading(false);
    if (result.ok) {
      navigate(result.role === "admin" ? "/" : "/citizen");
    } else {
      setError(result.error);
    }
  };

  // Demo credential fill
  const fillDemo = () => {
    if (mode === "admin") setForm({ username: "admin", password: "sih2024" });
    else setForm({ username: "demo", password: "demo" });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--ink)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "Outfit",
    }}
      className="grid-bg"
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "16px", background: "var(--amber)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", boxShadow: "0 0 32px rgba(255,183,43,0.4)",
        }}>
          <HardHat size={28} color="#0e0f0f" />
        </div>
        <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800, color: "var(--text)", margin: 0 }}>
          InfraPlan <span style={{ color: "var(--amber)" }}>AI</span>
        </h1>
        <p style={{ color: "var(--text3)", fontSize: "13px", marginTop: "6px", fontFamily: "IBM Plex Mono" }}>
          Smart Infrastructure & Urban Management · SIH 
        </p>
      </div>

      {!mode ? (
        /* Portal selector */
        <div style={{ display: "flex", gap: "20px", maxWidth: "1020px", width: "100%", padding: "0 20px" }}>
          {[
            {
              key: "admin",
              icon: ShieldCheck,
              title: "Administrator",
              desc: "Project managers, engineers & government officials",
              color: "var(--amber)",
              hint: "Create & manage infrastructure projects",
            },
            {
              key: "citizen",
              icon: Users,
              title: "Citizen Portal",
              desc: "Public users who want project information",
              color: "#60a5fa",
              hint: "View projects & ask questions",
            },
          ].map(({ key, icon: Icon, title, desc, color, hint }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                flex: 1, background: "var(--ink2)", border: `1px solid ${color}30`,
                borderRadius: "16px", padding: "28px 20px", cursor: "pointer",
                textAlign: "left", transition: "all 0.2s", color: "var(--text)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.background = `${color}0a`;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 8px 30px ${color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${color}30`;
                e.currentTarget.style.background = "var(--ink2)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: `${color}18`, display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: "14px",
              }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div style={{ fontFamily: "Syne", fontSize: "17px", fontWeight: 700, marginBottom: "6px" }}>{title}</div>
              <div style={{ fontSize: "12px", color: "var(--text3)", lineHeight: 1.5, marginBottom: "12px" }}>{desc}</div>
              <div style={{ fontSize: "11px", color, fontFamily: "IBM Plex Mono" }}>→ {hint}</div>
            </button>
          ))}
        </div>
      ) : (
        /* Login form */
        <div style={{
          width: "100%", maxWidth: "500px", padding: "0 20px",
        }}>
          <div style={{
            background: "var(--ink2)", border: `1px solid ${mode === "admin" ? "rgba(255,183,43,0.25)" : "rgba(96,165,250,0.25)"}`,
            borderRadius: "16px", padding: "32px",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: mode === "admin" ? "rgba(255,183,43,0.12)" : "rgba(96,165,250,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {mode === "admin"
                  ? <ShieldCheck size={20} style={{ color: "var(--amber)" }} />
                  : <Users size={20} style={{ color: "#60a5fa" }} />}
              </div>
              <div>
                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "16px" }}>
                  {mode === "admin" ? "Admin Login" : "Citizen Login"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text3)" }}>
                  {mode === "admin" ? "Project management portal" : "Public information portal"}
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text3)", marginBottom: "6px", fontFamily: "IBM Plex Mono", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Username
                </label>
                <input
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder={mode === "admin" ? "admin" : "citizen"}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "20px", position: "relative" }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text3)", marginBottom: "6px", fontFamily: "IBM Plex Mono", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: "40px" }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 0,
                  }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px",
                  borderRadius: "8px", marginBottom: "14px", fontSize: "13px",
                  background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)",
                }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "12px", borderRadius: "9px", border: "none",
                  background: mode === "admin" ? "var(--amber)" : "#3b82f6",
                  color: mode === "admin" ? "#0e0f0f" : "white",
                  fontFamily: "Syne", fontWeight: 700, fontSize: "15px", cursor: "pointer",
                  transition: "all 0.2s", opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Signing in…" : `Sign in as ${mode === "admin" ? "Administrator" : "Citizen"}`}
              </button>
            </form>

            {/* Demo hint */}
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <button onClick={fillDemo} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: "12px",
                color: "var(--text3)", fontFamily: "IBM Plex Mono", textDecoration: "underline",
              }}>
                Fill demo credentials
              </button>
            </div>

            <button onClick={() => { setMode(null); setForm({ username: "", password: "" }); setError(""); }}
              style={{ display: "block", width: "100%", marginTop: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--text3)", textAlign: "center" }}>
              ← Back to portal selection
            </button>
          </div>

          {/* Credentials hint card */}
          <div style={{
            marginTop: "14px", padding: "12px 16px", borderRadius: "10px",
            background: "rgba(255,183,43,0.05)", border: "1px solid rgba(255,183,43,0.1)",
            fontSize: "12px", color: "var(--text3)", fontFamily: "IBM Plex Mono",
          }}>
            <div style={{ marginBottom: "4px", color: "var(--amber)" }}>Demo credentials:</div>
            {mode === "admin"
              ? <><div>admin / sih2024</div><div>engineer1 / infra123</div></>
              : <><div>citizen / citizen123</div><div>demo / demo</div></>}
          </div>
        </div>
      )}
    </div>
  );
}
