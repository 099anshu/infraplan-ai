import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { ArrowLeft, TrendingUp, AlertTriangle, IndianRupee, CheckCircle2 } from "lucide-react";
import useStore from "../../store/useStore.js";

const COLORS = ["#ffb72b", "#4ade80", "#60a5fa", "#a78bfa", "#f472b6", "#34d399", "#fb923c"];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#252628", border: "1px solid rgba(255,183,43,0.2)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", fontFamily: "Outfit" }}>
      {label && <p style={{ color: "#9a9690", marginBottom: "4px" }}>{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color || "#ffb72b" }}>
          {p.name}: ₹{typeof p.value === "number" ? p.value.toFixed(1) : p.value} Cr
        </p>
      ))}
    </div>
  );
};

// Parse cost string like "₹3.2 Cr" → number 3.2
function parseCost(str) {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export default function BudgetTracker() {
  const { id } = useParams();
  const { currentProject, fetchProject } = useStore();
  const [spendOverride, setSpendOverride] = useState({});

  useEffect(() => { fetchProject(id); }, [id]);

  if (!currentProject) return (
    <div className="flex items-center justify-center h-full">
      <p style={{ color: "var(--text3)" }}>Loading…</p>
    </div>
  );

  const allTasks = currentProject.phases?.flatMap((p) => p.tasks) || [];
  const totalBudget = parseCost(currentProject.totalEstimatedCost);

  // ── Per-phase budget breakdown ──────────────────────────────────────────────
  const phaseData = currentProject.phases?.map((phase) => {
    const estimated = phase.tasks.reduce((s, t) => s + parseCost(t.estimatedCost), 0);
    const completedTasks = phase.tasks.filter((t) => t.status === "completed");
    const spent = completedTasks.reduce((s, t) => s + parseCost(t.estimatedCost), 0);
    const override = spendOverride[phase.phaseId];
    const actualSpent = override !== undefined ? override : spent;
    return {
      name: phase.phaseName.length > 14 ? phase.phaseName.slice(0, 14) + "…" : phase.phaseName,
      fullName: phase.phaseName,
      phaseId: phase.phaseId,
      estimated: parseFloat(estimated.toFixed(1)),
      spent: parseFloat(actualSpent.toFixed(1)),
      remaining: parseFloat(Math.max(0, estimated - actualSpent).toFixed(1)),
    };
  }) || [];

  // ── Category cost pie ───────────────────────────────────────────────────────
  const catMap = {};
  allTasks.forEach((t) => {
    const c = parseCost(t.estimatedCost);
    catMap[t.category] = (catMap[t.category] || 0) + c;
  });
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }))
    .sort((a, b) => b.value - a.value);

  // ── Burn rate line (cumulative spend over phases) ───────────────────────────
  let cumEstimated = 0, cumSpent = 0;
  const burnData = phaseData.map((ph) => {
    cumEstimated += ph.estimated;
    cumSpent += ph.spent;
    return {
      name: ph.phaseId,
      planned: parseFloat(cumEstimated.toFixed(1)),
      actual: parseFloat(cumSpent.toFixed(1)),
    };
  });

  // ── Summary numbers ─────────────────────────────────────────────────────────
  const totalEstimated = phaseData.reduce((s, p) => s + p.estimated, 0);
  const totalSpent = phaseData.reduce((s, p) => s + p.spent, 0);
  const totalRemaining = Math.max(0, totalEstimated - totalSpent);
  const spendPct = totalEstimated > 0 ? Math.round((totalSpent / totalEstimated) * 100) : 0;
  const isOverBudget = totalSpent > totalEstimated;
  const variance = totalSpent - totalEstimated;

  const tick = { fill: "#5a5753", fontSize: 11, fontFamily: "IBM Plex Mono" };

  return (
    <div className="p-8 fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/project/${id}`}>
          <button className="btn btn-ghost py-2 px-3">
            <ArrowLeft size={14} /> Back
          </button>
        </Link>
        <div>
          <div className="text-xs font-mono mb-0.5" style={{ color: "var(--text3)" }}>BUDGET TRACKER</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne" }}>
            {currentProject.projectName} — <span style={{ color: "var(--amber)" }}>Cost Analysis</span>
          </h1>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Budget", value: `₹${totalBudget || totalEstimated.toFixed(1)} Cr`, color: "#60a5fa", icon: IndianRupee },
          { label: "Spent So Far", value: `₹${totalSpent.toFixed(1)} Cr`, color: isOverBudget ? "#f87171" : "#ffb72b", icon: TrendingUp },
          { label: "Remaining", value: `₹${totalRemaining.toFixed(1)} Cr`, color: "#4ade80", icon: CheckCircle2 },
          {
            label: isOverBudget ? "Over Budget!" : "Budget Variance",
            value: `${isOverBudget ? "+" : ""}₹${Math.abs(variance).toFixed(1)} Cr`,
            color: isOverBudget ? "#f87171" : "#4ade80",
            icon: AlertTriangle,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text3)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="text-2xl font-bold" style={{ fontFamily: "Syne", color }}>{value}</div>
            {label === "Spent So Far" && (
              <div className="mt-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ink3)" }}>
                  <div style={{
                    width: `${Math.min(spendPct, 100)}%`, height: "100%",
                    background: spendPct > 90 ? "#f87171" : spendPct > 70 ? "#facc15" : "#ffb72b",
                    transition: "width 0.8s ease",
                  }} />
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text3)" }}>{spendPct}% of budget used</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Phase budget bar */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>Budget by Phase (₹ Cr)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={phaseData} barGap={4}>
              <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "IBM Plex Mono", color: "#9a9690" }} />
              <Bar dataKey="estimated" name="Estimated" fill="rgba(255,183,43,0.3)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="spent" name="Spent" fill="#ffb72b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>Cost by Category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<TT />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {catData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span style={{ color: "var(--text2)" }}>{item.name}</span>
                  <span className="ml-auto font-mono" style={{ color: "var(--amber)" }}>₹{item.value}Cr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Burn rate chart */}
      <div className="card p-5 mb-5">
        <h3 className="font-bold text-sm mb-1" style={{ fontFamily: "Syne" }}>Cumulative Burn Rate</h3>
        <p className="text-xs mb-4" style={{ color: "var(--text3)" }}>
          Planned vs actual spend across phases — gap shows over/underspend
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={burnData}>
            <CartesianGrid stroke="rgba(255,183,43,0.06)" />
            <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "IBM Plex Mono", color: "#9a9690" }} />
            <Line type="monotone" dataKey="planned" name="Planned" stroke="rgba(255,183,43,0.4)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#ffb72b" strokeWidth={2.5} dot={{ fill: "#ffb72b", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-phase editable spend table */}
      <div className="card overflow-hidden">
        <div className="p-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-bold text-sm" style={{ fontFamily: "Syne" }}>Phase-wise Breakdown</h3>
          <span className="text-xs ml-auto" style={{ color: "var(--text3)" }}>
            Click "Actual Spent" to edit
          </span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Phase", "Tasks", "Estimated", "Actual Spent", "Remaining", "Status"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--text3)", fontFamily: "IBM Plex Mono", fontSize: "11px", fontWeight: 500, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phaseData.map((ph, i) => {
              const phase = currentProject.phases[i];
              const completedCount = phase?.tasks.filter((t) => t.status === "completed").length || 0;
              const overspent = ph.spent > ph.estimated;
              return (
                <tr key={ph.phaseId} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(255,183,43,0.015)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div className="font-semibold">{ph.fullName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "IBM Plex Mono" }}>{ph.phaseId}</div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text2)" }}>
                    {completedCount}/{phase?.tasks.length || 0} done
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "IBM Plex Mono", color: "var(--text2)" }}>
                    ₹{ph.estimated} Cr
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={spendOverride[ph.phaseId] !== undefined ? spendOverride[ph.phaseId] : ph.spent}
                      onChange={(e) => setSpendOverride((prev) => ({ ...prev, [ph.phaseId]: parseFloat(e.target.value) || 0 }))}
                      style={{
                        width: "90px", padding: "4px 8px", fontFamily: "IBM Plex Mono", fontSize: "12px",
                        background: "var(--ink3)", border: `1px solid ${overspent ? "rgba(248,113,113,0.4)" : "var(--border)"}`,
                        color: overspent ? "#f87171" : "var(--amber)", borderRadius: "6px",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--text3)", marginLeft: "4px" }}>Cr</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "IBM Plex Mono", color: overspent ? "#f87171" : "#4ade80" }}>
                    {overspent ? `-₹${Math.abs(ph.remaining).toFixed(1)}` : `₹${ph.remaining}`} Cr
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                      background: overspent ? "rgba(248,113,113,0.1)" : ph.spent > 0 ? "rgba(255,183,43,0.1)" : "rgba(255,255,255,0.04)",
                      color: overspent ? "#f87171" : ph.spent > 0 ? "#ffb72b" : "#5a5753",
                    }}>
                      {overspent ? "Over Budget" : ph.spent > 0 ? "In Progress" : "Not Started"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
