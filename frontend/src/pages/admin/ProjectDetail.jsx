import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Network, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, Play, Ban, Milestone, ExternalLink, IndianRupee, TrendingDown, FileDown, Loader2 } from "lucide-react";
import useStore from "../../store/useStore.js";
import { exportProjectPDF } from "../../utils/pdfExport.js";

const STATUS_OPT = ["pending", "in-progress", "completed", "blocked"];
const CAT_COLOR = {
  Planning: "#60a5fa", Design: "#a78bfa", Procurement: "#fb923c",
  Construction: "#facc15", Testing: "#4ade80", Compliance: "#f472b6", Monitoring: "#34d399",
};

function TaskRow({ task, projectId }) {
  const [open, setOpen] = useState(false);
  const { updateTask } = useStore();

  const statusColor = { pending: "#5a5753", "in-progress": "#60a5fa", completed: "#4ade80", blocked: "#f87171" };
  const sc = statusColor[task.status] || "#5a5753";

  return (
    <div className="rounded-lg transition-all overflow-hidden"
      style={{ background: "var(--ink3)", border: `1px solid ${task.milestoneFlag ? "rgba(255,183,43,0.3)" : "var(--border)"}` }}>
      {/* Row header */}
      <div className="flex items-center gap-2.5 p-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <span className="font-mono text-xs px-1.5 py-0.5 rounded shrink-0"
          style={{ background: "var(--amber-glow)", color: "var(--amber)" }}>
          {task.taskId}
        </span>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLOR[task.category] || "#5a5753" }} />
        <span className="flex-1 text-sm font-medium truncate">{task.taskName}</span>
        {task.milestoneFlag && <Milestone size={13} style={{ color: "var(--amber)", shrink: 0 }} />}
        <span className={`text-xs font-bold shrink-0 p-${task.priority}`}>{task.priority}</span>

        <select
          value={task.status || "pending"}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); updateTask(projectId, task.taskId, { status: e.target.value }); }}
          className="text-xs rounded-lg px-2 py-1 shrink-0"
          style={{ background: "var(--ink2)", border: `1px solid ${sc}40`, color: sc, width: "108px", fontFamily: "IBM Plex Mono" }}
        >
          {STATUS_OPT.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-1.5 shrink-0 w-20">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--ink2)" }}>
            <div style={{ width: `${task.completionPercent || 0}%`, height: "100%", background: task.completionPercent === 100 ? "#4ade80" : "var(--amber)" }} />
          </div>
          <span className="font-mono text-xs" style={{ color: "var(--text3)" }}>{task.completionPercent || 0}%</span>
        </div>
        {open ? <ChevronUp size={13} style={{ color: "var(--text3)" }} /> : <ChevronDown size={13} style={{ color: "var(--text3)" }} />}
      </div>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text2)" }}>{task.description}</p>
          <div className="grid grid-cols-4 gap-3 text-xs">
            {[["Duration", `${task.durationDays}d`], ["Cost", task.estimatedCost], ["Team", task.assignedTeam], ["Risk", task.riskLevel]].map(([k, v]) => (
              <div key={k}>
                <div style={{ color: "var(--text3)" }}>{k}</div>
                <div className="font-semibold mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          {task.dependencies?.length > 0 && (
            <div className="text-xs">
              <span style={{ color: "var(--text3)" }}>Depends on: </span>
              {task.dependencies.map((d) => (
                <span key={d} className="inline-block px-1.5 py-0.5 rounded mr-1 font-mono"
                  style={{ background: "var(--amber-glow)", color: "var(--amber)" }}>{d}</span>
              ))}
            </div>
          )}
          {task.riskNote && (
            <div className="flex items-start gap-2 text-xs p-2 rounded-lg"
              style={{ background: "rgba(248,113,113,0.05)", color: "#f87171" }}>
              <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {task.riskNote}
            </div>
          )}
          {/* % slider */}
          <div className="flex items-center gap-3 text-xs">
            <span style={{ color: "var(--text3)" }}>Completion:</span>
            <input
              type="range" min="0" max="100" step="5"
              value={task.completionPercent || 0}
              onChange={(e) => updateTask(projectId, task.taskId, { completionPercent: Number(e.target.value) })}
              className="flex-1"
              style={{ accentColor: "var(--amber)", background: "none", border: "none", padding: "0" }}
            />
            <span className="font-mono font-bold" style={{ color: "var(--amber)" }}>{task.completionPercent || 0}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { currentProject, fetchProject } = useStore();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [expandedPhase, setExpandedPhase] = useState(null);

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await exportProjectPDF(currentProject); } catch (e) { console.error(e); }
    setPdfLoading(false);
  };

  useEffect(() => { fetchProject(id); }, [id]);

  if (!currentProject) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl mb-3">⚙️</div>
        <p style={{ color: "var(--text3)" }}>Loading…</p>
      </div>
    </div>
  );

  const allTasks = currentProject.phases?.flatMap((p) => p.tasks) || [];
  const done = allTasks.filter((t) => t.status === "completed").length;
  const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;
  const cats = ["All", ...new Set(allTasks.map((t) => t.category))];

  return (
    <div className="p-8 fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: "var(--text3)" }}>PROJECT DETAIL</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne" }}>{currentProject.projectName}</h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: "var(--text2)" }}>{currentProject.summary}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/project/${id}/graph`}>
            <button className="btn btn-ghost py-2 px-3 text-sm">
              <Network size={14} /> Graph
            </button>
          </Link>
          <Link to={`/project/${id}/budget`}>
            <button className="btn btn-ghost py-2 px-3 text-sm">
              <IndianRupee size={14} /> Budget
            </button>
          </Link>
          <Link to={`/project/${id}/delay`}>
            <button className="btn btn-ghost py-2 px-3 text-sm">
              <TrendingDown size={14} /> Delay AI
            </button>
          </Link>
          <button
            className="btn btn-amber py-2 px-3 text-sm"
            onClick={handlePDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            {pdfLoading ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { l: "Feasibility", v: `${currentProject.feasibilityScore}/100`, c: currentProject.feasibilityScore >= 75 ? "#4ade80" : "#facc15" },
          { l: "Duration", v: `${currentProject.totalEstimatedDays}d`, c: "var(--amber)" },
          { l: "Budget", v: currentProject.totalEstimatedCost, c: "#60a5fa" },
          { l: "Tasks", v: `${done}/${allTasks.length}`, c: "#a78bfa" },
          { l: "Progress", v: `${pct}%`, c: pct > 66 ? "#4ade80" : pct > 33 ? "#facc15" : "#fb923c" },
        ].map(({ l, v, c }) => (
          <div key={l} className="card p-4 text-center">
            <div className="text-2xl font-bold" style={{ fontFamily: "Syne", color: c }}>{v}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-4 mb-5">
        <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text3)" }}>
          <span>Overall Progress</span><span>{done}/{allTasks.length} tasks complete</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--ink3)" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--amber), #4ade80)", transition: "width 0.8s ease" }} />
        </div>
      </div>

      {/* High risks */}
      {currentProject.risks?.filter((r) => r.severity === "High").length > 0 && (
        <div className="card p-4 mb-5" style={{ borderColor: "rgba(248,113,113,0.3)" }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#f87171" }}>
            <AlertTriangle size={13} /> High Risk Items
          </h3>
          <div className="space-y-2">
            {currentProject.risks.filter((r) => r.severity === "High").map((r) => (
              <div key={r.riskId} className="text-xs p-2.5 rounded-lg" style={{ background: "rgba(248,113,113,0.05)" }}>
                <b>{r.title}:</b> {r.description}
                <div className="mt-1" style={{ color: "var(--text2)" }}>↳ {r.mitigation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {cats.map((cat) => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
            style={{
              background: filterCat === cat ? "var(--amber-glow)" : "var(--ink3)",
              color: filterCat === cat ? "var(--amber)" : "var(--text3)",
              border: `1px solid ${filterCat === cat ? "var(--border2)" : "var(--border)"}`,
            }}>
            {cat !== "All" && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: CAT_COLOR[cat] }} />}
            {cat}
          </button>
        ))}
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {currentProject.phases?.map((phase) => {
          const pts = phase.tasks.filter((t) => filterCat === "All" || t.category === filterCat);
          if (!pts.length) return null;
          const pdone = pts.filter((t) => t.status === "completed").length;
          const isOpen = expandedPhase === phase.phaseId || expandedPhase === null;

          return (
            <div key={phase.phaseId} className="card overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer transition-all"
                style={{ background: "var(--ink2)" }}
                onClick={() => setExpandedPhase(isOpen && expandedPhase === phase.phaseId ? null : phase.phaseId)}
              >
                <span className="font-mono text-xs px-2 py-1 rounded font-bold"
                  style={{ background: "var(--amber-glow)", color: "var(--amber)" }}>
                  {phase.phaseId}
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-sm" style={{ fontFamily: "Syne" }}>{phase.phaseName}</h3>
                  <p className="text-xs" style={{ color: "var(--text3)" }}>
                    {phase.durationDays} days · {pdone}/{pts.length} done
                  </p>
                </div>
                <div className="w-24 h-1 rounded-full overflow-hidden mr-2" style={{ background: "var(--ink3)" }}>
                  <div style={{ width: `${pts.length ? (pdone / pts.length) * 100 : 0}%`, height: "100%", background: "var(--amber)" }} />
                </div>
                {isOpen && expandedPhase === phase.phaseId
                  ? <ChevronUp size={14} style={{ color: "var(--text3)" }} />
                  : <ChevronDown size={14} style={{ color: "var(--text3)" }} />}
              </div>

              {(expandedPhase === phase.phaseId || expandedPhase === null) && (
                <div className="px-4 pb-4 space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  {pts.map((task) => (
                    <TaskRow key={task.taskId} task={task} projectId={id} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {currentProject.recommendations?.length > 0 && (
        <div className="card p-5 mt-5">
          <h3 className="font-bold mb-3" style={{ fontFamily: "Syne" }}>AI Recommendations</h3>
          <ul className="space-y-2">
            {currentProject.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span style={{ color: "var(--amber)" }}>→</span>
                <span style={{ color: "var(--text2)" }}>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
