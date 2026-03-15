import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, TrendingDown, TrendingUp, Zap, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, AreaChart, Area } from "recharts";
import useStore from "../../store/useStore.js";

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#252628", border: "1px solid rgba(255,183,43,0.2)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px" }}>
      <p style={{ color: "#9a9690", marginBottom: "4px" }}>{label}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}%</p>)}
    </div>
  );
};

function runPrediction(project) {
  if (!project?.phases) return null;
  const allTasks = project.phases.flatMap((p) => p.tasks);
  const total = allTasks.length;
  if (total === 0) return null;

  const completed = allTasks.filter((t) => t.status === "completed").length;
  const inProgress = allTasks.filter((t) => t.status === "in-progress").length;
  const blocked = allTasks.filter((t) => t.status === "blocked").length;
  const pending = allTasks.filter((t) => t.status === "pending").length;
  const completionRate = completed / total;

  // Average completion % across all tasks
  const avgCompletion = allTasks.reduce((s, t) => s + (t.completionPercent || 0), 0) / total;

  // Critical path tasks not done
  const criticalSet = new Set(project.criticalPath || []);
  const criticalTasksTotal = [...criticalSet].length;
  const criticalDone = allTasks.filter((t) => criticalSet.has(t.taskId) && t.status === "completed").length;
  const criticalPct = criticalTasksTotal > 0 ? criticalDone / criticalTasksTotal : 0;

  // High priority blocked tasks
  const criticalBlocked = allTasks.filter((t) => t.status === "blocked" && (t.priority === "Critical" || t.priority === "High")).length;

  // Estimated delay calculation
  const plannedDays = project.totalEstimatedDays || 365;
  let delayDays = 0;
  let delayReason = [];

  if (blocked > 0) {
    delayDays += blocked * 7;
    delayReason.push(`${blocked} blocked task${blocked > 1 ? "s" : ""} causing ~${blocked * 7} day delay`);
  }
  if (criticalBlocked > 0) {
    delayDays += criticalBlocked * 14;
    delayReason.push(`${criticalBlocked} critical/high-priority blocked task${criticalBlocked > 1 ? "s" : ""} adding ${criticalBlocked * 14} days`);
  }
  if (completionRate < 0.1 && total > 5) {
    delayDays += Math.floor(plannedDays * 0.1);
    delayReason.push("Low overall task completion rate");
  }
  if (criticalPct < 0.3 && criticalTasksTotal > 2) {
    delayDays += 21;
    delayReason.push("Critical path tasks significantly behind schedule");
  }

  // Confidence score (0-100) — higher = more confident in prediction
  const dataPoints = completed + blocked + inProgress;
  const confidence = Math.min(95, Math.max(30, dataPoints * 15));

  // Risk level
  const riskLevel = delayDays === 0 ? "On Track" : delayDays < 14 ? "Minor Risk" : delayDays < 45 ? "Moderate Risk" : "High Risk";
  const riskColor = { "On Track": "#4ade80", "Minor Risk": "#facc15", "Moderate Risk": "#fb923c", "High Risk": "#f87171" }[riskLevel];

  // Projected completion timeline
  const today = new Date();
  const projectedEnd = new Date(today.getTime() + (plannedDays + delayDays) * 24 * 60 * 60 * 1000);

  // Phase-wise health
  const phaseHealth = project.phases.map((ph) => {
    const phTasks = ph.tasks;
    const phDone = phTasks.filter((t) => t.status === "completed").length;
    const phBlocked = phTasks.filter((t) => t.status === "blocked").length;
    const phPct = Math.round((phDone / phTasks.length) * 100);
    const health = phBlocked > 0 ? "At Risk" : phPct === 100 ? "Complete" : phPct > 50 ? "Progressing" : "Behind";
    const healthColor = { "At Risk": "#f87171", "Complete": "#4ade80", "Progressing": "#ffb72b", "Behind": "#fb923c" }[health];
    return { name: ph.phaseName, pct: phPct, health, healthColor, blocked: phBlocked, done: phDone, total: phTasks.length };
  });

  // Simulated progress curve (what it should look like vs actual)
  const progressCurve = project.phases.map((ph, i) => {
    const idealPct = Math.round(((i + 1) / project.phases.length) * 100);
    const ph_tasks = ph.tasks;
    const actualPct = Math.round((ph_tasks.filter((t) => t.status === "completed").length / ph_tasks.length) * 100);
    return { phase: ph.phaseId, ideal: idealPct, actual: actualPct };
  });

  // Recommendations
  const recommendations = [];
  if (criticalBlocked > 0) recommendations.push({ severity: "High", text: `Immediately unblock ${criticalBlocked} critical-path task(s) — each day of delay compounds across dependencies` });
  if (blocked > 0) recommendations.push({ severity: "Medium", text: `Resolve ${blocked} blocked task(s). Assign dedicated resources or escalate to project manager` });
  if (inProgress > total * 0.6) recommendations.push({ severity: "Medium", text: "Too many tasks in-progress simultaneously — focus team on completing current tasks before starting new ones" });
  if (pending > total * 0.7 && completed < total * 0.1) recommendations.push({ severity: "Low", text: "Project is in early stages — ensure Phase 1 milestones are met before proceeding to Phase 2" });
  if (delayDays === 0) recommendations.push({ severity: "Good", text: "Project is on track! Maintain current velocity and monitor blocked tasks proactively" });

  return {
    completionRate: Math.round(completionRate * 100),
    avgCompletion: Math.round(avgCompletion),
    completed, inProgress, blocked, pending, total,
    delayDays,
    delayReason,
    riskLevel, riskColor,
    confidence,
    projectedEnd: projectedEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    plannedDays,
    criticalPct: Math.round(criticalPct * 100),
    criticalDone, criticalTasksTotal,
    phaseHealth,
    progressCurve,
    recommendations,
  };
}

export default function DelayPrediction() {
  const { id } = useParams();
  const { currentProject, fetchProject } = useStore();

  useEffect(() => { fetchProject(id); }, [id]);

  if (!currentProject) return (
    <div className="flex items-center justify-center h-full">
      <p style={{ color: "var(--text3)" }}>Loading…</p>
    </div>
  );

  const pred = runPrediction(currentProject);
  if (!pred) return (
    <div className="p-8">
      <p style={{ color: "var(--text3)" }}>Not enough data yet. Start updating task statuses to see predictions.</p>
    </div>
  );

  const tick = { fill: "#5a5753", fontSize: 11, fontFamily: "IBM Plex Mono" };
  const sevColor = { High: "#f87171", Medium: "#fb923c", Low: "#facc15", Good: "#4ade80" };

  return (
    <div className="p-8 fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/project/${id}`}>
          <button className="btn btn-ghost py-2 px-3"><ArrowLeft size={14} /> Back</button>
        </Link>
        <div>
          <div className="text-xs font-mono mb-0.5" style={{ color: "var(--text3)" }}>DELAY PREDICTION AI</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne" }}>
            {currentProject.projectName} — <span style={{ color: "var(--amber)" }}>Schedule Analysis</span>
          </h1>
        </div>
      </div>

      {/* Risk verdict banner */}
      <div className="rounded-xl p-5 mb-6 flex items-center gap-5"
        style={{ background: `${pred.riskColor}10`, border: `1px solid ${pred.riskColor}40` }}>
        <div className="text-4xl">
          {pred.riskLevel === "On Track" ? "✅" : pred.riskLevel === "Minor Risk" ? "⚠️" : pred.riskLevel === "Moderate Risk" ? "🔶" : "🚨"}
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold mb-1" style={{ fontFamily: "Syne", color: pred.riskColor }}>
            {pred.riskLevel}
          </div>
          <div className="text-sm" style={{ color: "var(--text2)" }}>
            {pred.delayDays === 0
              ? "Project is progressing as planned based on current task completion data."
              : `Estimated delay: ${pred.delayDays} days beyond planned schedule.`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold" style={{ fontFamily: "Syne", color: pred.riskColor }}>
            +{pred.delayDays}d
          </div>
          <div className="text-xs" style={{ color: "var(--text3)" }}>predicted delay</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{pred.projectedEnd}</div>
          <div className="text-xs" style={{ color: "var(--text3)" }}>projected completion</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold" style={{ color: "var(--amber)" }}>{pred.confidence}%</div>
          <div className="text-xs" style={{ color: "var(--text3)" }}>confidence</div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { l: "Completed", v: pred.completed, color: "#4ade80", icon: CheckCircle2 },
          { l: "In Progress", v: pred.inProgress, color: "#60a5fa", icon: Clock },
          { l: "Blocked", v: pred.blocked, color: "#f87171", icon: AlertTriangle },
          { l: "Critical Path %", v: `${pred.criticalPct}%`, color: "var(--amber)", icon: Zap },
          { l: "Avg Completion", v: `${pred.avgCompletion}%`, color: "#a78bfa", icon: TrendingUp },
        ].map(({ l, v, color, icon: Icon }) => (
          <div key={l} className="card p-4 text-center">
            <div className="flex justify-center mb-2"><Icon size={14} style={{ color }} /></div>
            <div className="text-2xl font-bold" style={{ fontFamily: "Syne", color }}>{v}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Progress curve */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-1" style={{ fontFamily: "Syne" }}>Ideal vs Actual Progress</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text3)" }}>Gap between lines = schedule deviation per phase</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={pred.progressCurve}>
              <CartesianGrid stroke="rgba(255,183,43,0.06)" />
              <XAxis dataKey="phase" tick={tick} axisLine={false} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="ideal" name="Ideal" stroke="rgba(255,183,43,0.3)" fill="rgba(255,183,43,0.05)" strokeDasharray="4 2" strokeWidth={1.5} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#ffb72b" fill="rgba(255,183,43,0.08)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Phase health */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>Phase-wise Health</h3>
          <div className="space-y-3">
            {pred.phaseHealth.map((ph) => (
              <div key={ph.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate max-w-[60%]">{ph.name}</span>
                  <div className="flex items-center gap-2">
                    {ph.blocked > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                        {ph.blocked} blocked
                      </span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: `${ph.healthColor}15`, color: ph.healthColor }}>
                      {ph.health}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ink3)" }}>
                  <div style={{ width: `${ph.pct}%`, height: "100%", background: ph.healthColor, transition: "width 0.6s" }} />
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{ph.done}/{ph.total} tasks · {ph.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delay reasons */}
      {pred.delayReason.length > 0 && (
        <div className="card p-5 mb-5" style={{ borderColor: "rgba(248,113,113,0.3)" }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#f87171" }}>
            <TrendingDown size={14} /> Delay Causes Detected
          </h3>
          <ul className="space-y-2">
            {pred.delayReason.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span style={{ color: "#f87171" }}>→</span>
                <span style={{ color: "var(--text2)" }}>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      <div className="card p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "Syne" }}>
          <Zap size={14} style={{ color: "var(--amber)" }} /> AI Recommendations
        </h3>
        <div className="space-y-2">
          {pred.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg text-sm"
              style={{ background: `${sevColor[r.severity]}08`, border: `1px solid ${sevColor[r.severity]}25` }}>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0 mt-0.5"
                style={{ background: `${sevColor[r.severity]}20`, color: sevColor[r.severity] }}>
                {r.severity}
              </span>
              <span style={{ color: "var(--text2)" }}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
