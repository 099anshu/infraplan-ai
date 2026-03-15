import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, CheckCircle2, Clock, AlertTriangle, ChevronRight, Filter } from "lucide-react";
import useStore from "../../store/useStore.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_COLORS = { pending:"#60a5fa", "in-progress":"#ffb72b", completed:"#4ade80", blocked:"#f87171" };

function FeasBar({ score }) {
  const c = score >= 75 ? "#4ade80" : score >= 55 ? "#ffb72b" : "#f87171";
  return (
    <div className="flex items-center gap-2">
      <div style={{ flex:1, height:"4px", borderRadius:"2px", background:"var(--ink3)" }}>
        <div style={{ width:`${score}%`, height:"100%", background:c, borderRadius:"2px" }} />
      </div>
      <span style={{ fontSize:"11px", color:c, fontFamily:"IBM Plex Mono", fontWeight:700, minWidth:"24px" }}>{score}</span>
    </div>
  );
}

export default function CitizenHome() {
  const { projects, fetchProjects } = useStore();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => { fetchProjects(); }, []);

  const types = ["All", ...new Set(projects.map(p => p.projectType).filter(Boolean))];
  const filtered = projects.filter(p => {
    const matchSearch = !search || p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase()) ||
      p.projectType?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || p.projectType === filter;
    return matchSearch && matchFilter;
  });

  const allTasks = projects.flatMap(p => p.phases?.flatMap(ph => ph.tasks) || []);
  const totalBudget = projects.reduce((s, p) => {
    const n = parseFloat((p.totalEstimatedCost || "0").replace(/[^0-9.]/g, ""));
    return s + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto fade-up">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne" }}>
          Welcome, <span style={{ color: "#60a5fa" }}>{user?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
          Stay informed about infrastructure projects in your area — {user?.area}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { l:"Active Projects", v:projects.length, c:"#60a5fa" },
          { l:"Total Investment", v:`₹${totalBudget.toFixed(0)} Cr`, c:"#ffb72b" },
          { l:"Tasks Completed", v:allTasks.filter(t=>t.status==="completed").length, c:"#4ade80" },
        ].map(({ l,v,c }) => (
          <div key={l} className="card p-4 text-center">
            <div className="text-2xl font-bold" style={{ fontFamily:"Syne", color:c }}>{v}</div>
            <div className="text-xs mt-1" style={{ color:"var(--text3)" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects by name, location or type…"
            style={{ paddingLeft:"36px" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {types.slice(0,4).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="text-xs px-3 py-2 rounded-lg transition-all font-medium"
              style={{
                background: filter===t ? "rgba(96,165,250,0.15)" : "var(--ink3)",
                color: filter===t ? "#60a5fa" : "var(--text3)",
                border: `1px solid ${filter===t ? "rgba(96,165,250,0.3)" : "var(--border)"}`,
                cursor:"pointer", fontFamily:"Outfit",
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Project cards */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p style={{ color:"var(--text2)" }}>
            {projects.length === 0 ? "No infrastructure projects to display yet." : "No projects match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const tasks = p.phases?.flatMap(ph => ph.tasks) || [];
            const done = tasks.filter(t => t.status==="completed").length;
            const pct = tasks.length ? Math.round((done/tasks.length)*100) : 0;
            const blocked = tasks.filter(t => t.status==="blocked").length;
            const statusColor = blocked > 0 ? "#f87171" : pct>=80 ? "#4ade80" : "#60a5fa";

            return (
              <Link key={p.id} to={`/citizen/project/${p.id}`} style={{ textDecoration:"none" }}>
                <div className="card p-5 transition-all hover:border-blue-500/20 group" style={{ cursor:"pointer" }}>
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ background:statusColor }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-base" style={{ fontFamily:"Syne" }}>{p.projectName}</h3>
                        {p.projectType && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", border:"1px solid rgba(96,165,250,0.2)" }}>
                            {p.projectType}
                          </span>
                        )}
                        {blocked > 0 && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(248,113,113,0.1)", color:"#f87171" }}>
                            <AlertTriangle size={9} /> {blocked} blocked
                          </span>
                        )}
                      </div>

                      <p className="text-sm mb-3 line-clamp-2" style={{ color:"var(--text2)" }}>{p.summary}</p>

                      <div className="grid gap-2" style={{ gridTemplateColumns:"1fr 1fr" }}>
                        <div>
                          <div className="text-xs mb-1" style={{ color:"var(--text3)" }}>Feasibility Score</div>
                          <FeasBar score={p.feasibilityScore || 0} />
                        </div>
                        <div>
                          <div className="text-xs mb-1" style={{ color:"var(--text3)" }}>Project Progress</div>
                          <div className="flex items-center gap-2">
                            <div style={{ flex:1, height:"4px", borderRadius:"2px", background:"var(--ink3)" }}>
                              <div style={{ width:`${pct}%`, height:"100%", background:statusColor, borderRadius:"2px" }} />
                            </div>
                            <span style={{ fontSize:"11px", color:statusColor, fontFamily:"IBM Plex Mono", fontWeight:700 }}>{pct}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 text-xs mt-3" style={{ color:"var(--text3)" }}>
                        <span>📍 {p.location || "India"}</span>
                        <span>💰 {p.totalEstimatedCost}</span>
                        <span>⏱ {p.totalEstimatedDays} days</span>
                        <span>✅ {done}/{tasks.length} tasks</span>
                      </div>
                    </div>

                    <ChevronRight size={18} style={{ color:"var(--text3)", flexShrink:0, marginTop:"4px" }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
