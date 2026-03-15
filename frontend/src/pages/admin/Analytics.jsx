import { useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import useStore from "../../store/useStore.js";

const COLORS = ["#ffb72b", "#4ade80", "#60a5fa", "#a78bfa", "#f472b6", "#34d399", "#fb923c"];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#252628", border: "1px solid rgba(255,183,43,0.2)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", fontFamily: "Outfit" }}>
      {label && <p style={{ color: "#9a9690", marginBottom: "4px" }}>{label}</p>}
      {payload.map((p) => <p key={p.name} style={{ color: p.color || "var(--amber)" }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Analytics() {
  const { projects, fetchProjects } = useStore();
  useEffect(() => { fetchProjects(); }, []);

  const allTasks = projects.flatMap((p) => p.phases?.flatMap((ph) => ph.tasks) || []);

  const statusData = ["pending", "in-progress", "completed", "blocked"].map((s) => ({
    name: s, count: allTasks.filter((t) => t.status === s).length,
  }));

  const catMap = {};
  allTasks.forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + 1; });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  const priMap = {};
  allTasks.forEach((t) => { priMap[t.priority] = (priMap[t.priority] || 0) + 1; });
  const priData = Object.entries(priMap).map(([name, value]) => ({ name, value }));

  const avgFeas = projects.length && projects[0]?.feasibilityBreakdown
    ? Object.keys(projects[0].feasibilityBreakdown).map((k) => ({
        subject: k.charAt(0).toUpperCase() + k.slice(1),
        value: Math.round(projects.reduce((s, p) => s + (p.feasibilityBreakdown?.[k] || 0), 0) / projects.length),
      }))
    : [];

  const projComp = projects.map((p) => ({
    name: (p.projectName || "").substring(0, 14) + ((p.projectName?.length || 0) > 14 ? "…" : ""),
    feasibility: p.feasibilityScore || 0,
  }));

  const tick = { fill: "#5a5753", fontSize: 11, fontFamily: "IBM Plex Mono" };

  return (
    <div className="p-8 fade-up">
      <div className="mb-8">
        <div className="text-xs font-mono mb-1" style={{ color: "var(--text3)" }}>ANALYTICS</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne" }}>
          Project <span style={{ color: "var(--amber)" }}>Insights</span>
        </h1>
      </div>

      {projects.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p style={{ color: "var(--text2)" }}>No projects yet. Create one to see analytics.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { l: "Projects", v: projects.length, c: "var(--amber)" },
              { l: "Total Tasks", v: allTasks.length, c: "#60a5fa" },
              { l: "Avg Feasibility", v: `${Math.round(projects.reduce((s, p) => s + (p.feasibilityScore || 0), 0) / projects.length)}%`, c: "#4ade80" },
              { l: "Completion", v: `${allTasks.length ? Math.round((allTasks.filter(t => t.status === "completed").length / allTasks.length) * 100) : 0}%`, c: "#a78bfa" },
            ].map(({ l, v, c }) => (
              <div key={l} className="card p-5 text-center">
                <div className="text-3xl font-bold" style={{ fontFamily: "Syne", color: c }}>{v}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text3)" }}>{l}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Status */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>Task Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData}>
                  <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusData.map((_, i) => <Cell key={i} fill={["#5a5753", "#60a5fa", "#4ade80", "#f87171"][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Categories pie */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>By Category</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
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
                      <span className="ml-auto font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Feasibility radar */}
            {avgFeas.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>Avg Feasibility Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={avgFeas}>
                    <PolarGrid stroke="rgba(255,183,43,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={tick} />
                    <Radar name="Score" dataKey="value" stroke="#ffb72b" fill="#ffb72b" fillOpacity={0.12} />
                    <Tooltip content={<TT />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Project comparison */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>Feasibility Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={projComp} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={tick} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={tick} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="feasibility" fill="#ffb72b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>Task Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={priData}>
                <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priData.map((e) => (
                    <Cell key={e.name} fill={{ Critical: "#f87171", High: "#fb923c", Medium: "#facc15", Low: "#4ade80" }[e.name] || "#ffb72b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
