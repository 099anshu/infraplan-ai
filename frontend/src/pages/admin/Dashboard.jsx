import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, ChevronRight, AlertTriangle, Cpu, TrendingUp, CheckSquare, Clock } from "lucide-react";
import useStore from "../../store/useStore.js";

function FeasBar({ score }) {
  const color = score >= 75 ? "#4ade80" : score >= 55 ? "#facc15" : "#f87171";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--ink3)" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: "2px", transition: "width 0.6s ease" }} />
      </div>
      <span className="font-mono text-xs font-bold" style={{ color, minWidth: "30px" }}>{score}</span>
    </div>
  );
}

export default function Dashboard() {
  const { projects, fetchProjects, deleteProject, modelStatus } = useStore();

  useEffect(() => { fetchProjects(); }, []);

  const allTasks = projects.flatMap((p) => p.phases?.flatMap((ph) => ph.tasks) || []);
  const done = allTasks.filter((t) => t.status === "completed").length;
  const inProgress = allTasks.filter((t) => t.status === "in-progress").length;

  return (
    <div className="p-8 fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: "var(--text3)" }}>SMART INFRASTRUCTURE PLANNING SYSTEM</div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "Syne", color: "var(--text)" }}>
            Project <span style={{ color: "var(--amber)" }}>Dashboard</span>
          </h1>
          {modelStatus && (
            <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--text3)" }}>
              <Cpu size={11} />
              {modelStatus.message}
            </div>
          )}
        </div>
        <Link to="/new">
          <button className="btn btn-amber">
            <Plus size={15} /> New Project
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Projects", value: projects.length, icon: TrendingUp, color: "var(--amber)" },
          { label: "Total Tasks", value: allTasks.length, icon: CheckSquare, color: "#60a5fa" },
          { label: "Completed", value: done, icon: CheckSquare, color: "#4ade80" },
          { label: "In Progress", value: inProgress, icon: Clock, color: "#fb923c" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "var(--text3)" }}>{label.toUpperCase()}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="text-3xl font-bold" style={{ fontFamily: "Syne", color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Projects list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-lg" style={{ fontFamily: "Syne" }}>Projects</h2>
        <span className="text-xs font-mono" style={{ color: "var(--text3)" }}>{projects.length} total</span>
      </div>

      {projects.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-5">🏗️</div>
          <p className="font-bold text-lg mb-2" style={{ fontFamily: "Syne" }}>No projects yet</p>
          <p className="text-sm mb-6" style={{ color: "var(--text2)" }}>
            Generate your first AI-powered infrastructure execution plan
          </p>
          <Link to="/new">
            <button className="btn btn-amber mx-auto">
              <Plus size={15} /> Create Project
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const tasks = p.phases?.flatMap((ph) => ph.tasks) || [];
            const completedCount = tasks.filter((t) => t.status === "completed").length;
            const pct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
            const highRisks = p.risks?.filter((r) => r.severity === "High").length || 0;

            return (
              <div
                key={p.id}
                className="card p-5 group transition-all hover:border-amber-400/20"
                style={{ cursor: "default" }}
              >
                <div className="flex items-center gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-bold text-base truncate" style={{ fontFamily: "Syne" }}>{p.projectName}</h3>
                      {p.dataSource === "phi3-finetuned" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>
                          Phi-3
                        </span>
                      )}
                      {highRisks > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                          <AlertTriangle size={10} /> {highRisks} high risk
                        </span>
                      )}
                    </div>
                    <p className="text-xs mb-3 line-clamp-1" style={{ color: "var(--text2)" }}>{p.summary}</p>
                    <div className="flex items-center gap-5 text-xs" style={{ color: "var(--text3)" }}>
                      <span>📅 {p.totalEstimatedDays}d</span>
                      <span>💰 {p.totalEstimatedCost}</span>
                      <span>📋 {tasks.length} tasks</span>
                    </div>
                  </div>

                  {/* Mid: feasibility */}
                  <div className="w-36 shrink-0">
                    <div className="text-xs mb-1.5" style={{ color: "var(--text3)" }}>Feasibility</div>
                    <FeasBar score={p.feasibilityScore || 0} />
                    <div className="mt-2 text-xs" style={{ color: "var(--text3)" }}>Progress: {pct}%</div>
                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--ink3)" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--amber)", transition: "width 0.6s" }} />
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/project/${p.id}`}>
                      <button className="btn btn-ghost p-2.5" style={{ borderRadius: "8px" }}>
                        <ChevronRight size={16} />
                      </button>
                    </Link>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="btn p-2.5"
                      style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: "8px" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
