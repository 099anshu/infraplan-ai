import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/useStore.js";
import { MapPin, ExternalLink, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

// City coordinates for Indian cities
const CITY_COORDS = {
  "Mumbai": { lat: 19.076, lng: 72.877 }, "Delhi": { lat: 28.613, lng: 77.209 },
  "Bangalore": { lat: 12.972, lng: 77.594 }, "Chennai": { lat: 13.083, lng: 80.270 },
  "Hyderabad": { lat: 17.385, lng: 78.487 }, "Pune": { lat: 18.520, lng: 73.856 },
  "Ahmedabad": { lat: 23.022, lng: 72.571 }, "Kolkata": { lat: 22.572, lng: 88.363 },
  "Jaipur": { lat: 26.912, lng: 75.787 }, "Surat": { lat: 21.170, lng: 72.831 },
  "Nagpur": { lat: 21.145, lng: 79.082 }, "Indore": { lat: 22.719, lng: 75.857 },
  "Bhopal": { lat: 23.259, lng: 77.412 }, "Lucknow": { lat: 26.847, lng: 80.946 },
  "Kochi": { lat: 9.931, lng: 76.267 }, "Chandigarh": { lat: 30.733, lng: 76.779 },
};

function getCoords(location) {
  if (!location) return { lat: 19.076, lng: 72.877 };
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (location.toLowerCase().includes(city.toLowerCase())) return coords;
  }
  return { lat: 19.076 + (Math.random() - 0.5) * 8, lng: 72.877 + (Math.random() - 0.5) * 8 };
}

function getStatusColor(project) {
  const tasks = project.phases?.flatMap(p => p.tasks) || [];
  const blocked = tasks.filter(t => t.status === "blocked").length;
  const done = tasks.filter(t => t.status === "completed").length;
  const pct = tasks.length ? done / tasks.length : 0;
  if (blocked > 0) return "#f87171";
  if (pct >= 0.8) return "#4ade80";
  if (pct >= 0.4) return "#ffb72b";
  return "#60a5fa";
}

export default function AdminMapView() {
  const { projects, fetchProjects } = useStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  // Build OpenStreetMap embed URL with markers
  const projectsWithCoords = projects.map(p => ({
    ...p,
    coords: getCoords(p.location || "Mumbai"),
    statusColor: getStatusColor(p),
  }));

  // Use Leaflet via CDN in iframe-free approach: render our own visual map
  const MAP_W = 100; // percentage
  const INDIA_BOUNDS = { minLat: 8, maxLat: 37, minLng: 68, maxLng: 97 };

  function projectToSVG(coords) {
    const x = ((coords.lng - INDIA_BOUNDS.minLng) / (INDIA_BOUNDS.maxLng - INDIA_BOUNDS.minLng)) * 100;
    const y = 100 - ((coords.lat - INDIA_BOUNDS.minLat) / (INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat)) * 100;
    return { x, y };
  }

  const tasks = selected ? (selected.phases?.flatMap(p => p.tasks) || []) : [];
  const done = tasks.filter(t => t.status === "completed").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="p-8 fade-up">
      <div className="mb-6">
        <div className="text-xs font-mono mb-1" style={{ color: "var(--text3)" }}>ADMIN · MAP VIEW</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne" }}>
          Infrastructure <span style={{ color: "var(--amber)" }}>Map</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
          All projects plotted across India — click a marker to view details
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {[["#4ade80","80%+ complete"],["#ffb72b","In progress"],["#60a5fa","Just started"],["#f87171","Has blocked tasks"]].map(([c,l]) => (
          <div key={l} className="flex items-center gap-2 text-xs" style={{ color: "var(--text3)" }}>
            <span className="w-3 h-3 rounded-full" style={{ background: c }} />
            {l}
          </div>
        ))}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: selected ? "1fr 340px" : "1fr" }}>
        {/* SVG Map of India */}
        <div className="card overflow-hidden" style={{ position: "relative", minHeight: "520px" }}>
          {projects.length === 0 ? (
            <div className="flex items-center justify-center h-full flex-col gap-3" style={{ minHeight: "520px" }}>
              <MapPin size={40} style={{ color: "var(--text3)" }} />
              <p style={{ color: "var(--text3)" }}>No projects yet. Create projects to see them on the map.</p>
            </div>
          ) : (
            <div style={{ position: "relative", width: "100%", paddingBottom: "60%", background: "#0f2040" }}>
              <svg
                viewBox="0 0 100 60"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* India rough outline as background hint */}
                <rect width="100" height="60" fill="#0a1628" />
                <text x="50" y="30" textAnchor="middle" fill="rgba(255,183,43,0.06)" fontSize="18" fontFamily="Syne" fontWeight="bold">INDIA</text>

                {/* Grid lines */}
                {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,183,43,0.04)" strokeWidth="0.3" />)}
                {[15,30,45].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,183,43,0.04)" strokeWidth="0.3" />)}

                {/* City labels */}
                {Object.entries(CITY_COORDS).map(([city, coords]) => {
                  const { x, y } = projectToSVG(coords);
                  return (
                    <text key={city} x={x} y={y} textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="1.8" fontFamily="IBM Plex Mono">{city}</text>
                  );
                })}

                {/* Project markers */}
                {projectsWithCoords.map((p) => {
                  const { x, y } = projectToSVG(p.coords);
                  const isSelected = selected?.id === p.id;
                  return (
                    <g key={p.id} style={{ cursor: "pointer" }} onClick={() => setSelected(isSelected ? null : p)}>
                      {/* Pulse ring */}
                      <circle cx={x} cy={y} r={isSelected ? 3.5 : 2.5} fill={p.statusColor} opacity="0.2">
                        <animate attributeName="r" values={`${isSelected ? 3.5 : 2.5};${isSelected ? 5 : 4};${isSelected ? 3.5 : 2.5}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                      </circle>
                      {/* Main dot */}
                      <circle cx={x} cy={y} r={isSelected ? 2.5 : 1.8} fill={p.statusColor} stroke={isSelected ? "white" : "none"} strokeWidth="0.4" />
                      {/* Label */}
                      <text x={x} y={y - 3} textAnchor="middle" fill="white" fontSize="1.6" fontFamily="Outfit" fontWeight="600">
                        {(p.projectName || "").substring(0, 16)}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Compass */}
              <div style={{ position: "absolute", bottom: "12px", right: "12px", fontSize: "10px", color: "rgba(255,183,43,0.4)", fontFamily: "IBM Plex Mono" }}>
                N ↑
              </div>
            </div>
          )}

          {/* Project count badge */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-mono"
            style={{ background: "rgba(0,0,0,0.6)", color: "var(--amber)", border: "1px solid var(--border2)" }}>
            {projects.length} projects plotted
          </div>
        </div>

        {/* Selected project panel */}
        {selected && (
          <div className="card p-5 fade-up space-y-4" style={{ alignSelf: "start", maxHeight: "520px", overflowY: "auto" }}>
            <div>
              <div className="text-xs font-mono mb-1" style={{ color: "var(--text3)" }}>SELECTED PROJECT</div>
              <h3 className="font-bold text-base" style={{ fontFamily: "Syne" }}>{selected.projectName}</h3>
              <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>{selected.summary?.substring(0, 120)}…</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: "Feasibility", v: `${selected.feasibilityScore}/100`, c: selected.feasibilityScore >= 75 ? "#4ade80" : "#facc15" },
                { l: "Progress", v: `${pct}%`, c: selected.statusColor },
                { l: "Duration", v: `${selected.totalEstimatedDays}d`, c: "var(--amber)" },
                { l: "Budget", v: selected.totalEstimatedCost, c: "#60a5fa" },
              ].map(({ l, v, c }) => (
                <div key={l} className="p-3 rounded-lg text-center" style={{ background: "var(--ink3)" }}>
                  <div className="font-bold text-sm" style={{ color: c, fontFamily: "Syne" }}>{v}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text3)" }}>
                <span>Task completion</span><span>{done}/{tasks.length}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--ink3)" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: selected.statusColor, transition: "width 0.6s" }} />
              </div>
            </div>

            {/* Risks */}
            {selected.risks?.filter(r => r.severity === "High").length > 0 && (
              <div className="p-3 rounded-lg" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
                <div className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: "#f87171" }}>
                  <AlertTriangle size={12} /> High Risks
                </div>
                {selected.risks.filter(r => r.severity === "High").map(r => (
                  <div key={r.riskId} className="text-xs mb-1" style={{ color: "var(--text2)" }}>• {r.title}</div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={() => navigate(`/project/${selected.id}`)}
                className="btn btn-amber w-full justify-center">
                <ExternalLink size={14} /> Open Project
              </button>
              <button onClick={() => navigate(`/project/${selected.id}/graph`)}
                className="btn btn-ghost w-full justify-center">
                View Task Graph
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All projects table below map */}
      {projects.length > 0 && (
        <div className="card mt-5 overflow-hidden">
          <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="font-bold text-sm" style={{ fontFamily: "Syne" }}>All Projects Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Project", "Location", "Feasibility", "Budget", "Progress", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--text3)", fontFamily: "IBM Plex Mono", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectsWithCoords.map((p, i) => {
                  const pts = p.phases?.flatMap(ph => ph.tasks) || [];
                  const pdone = pts.filter(t => t.status === "completed").length;
                  const ppct = pts.length ? Math.round((pdone / pts.length) * 100) : 0;
                  return (
                    <tr key={p.id} onClick={() => { setSelected(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === p.id ? "var(--amber-glow)" : "transparent" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.projectName}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text2)" }}>{p.location || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ color: p.feasibilityScore >= 75 ? "#4ade80" : "#facc15", fontWeight: 700 }}>{p.feasibilityScore}</span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--amber)", fontFamily: "IBM Plex Mono", fontSize: "12px" }}>{p.totalEstimatedCost}</td>
                      <td style={{ padding: "10px 14px", minWidth: "100px" }}>
                        <div className="flex items-center gap-2">
                          <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "var(--ink3)" }}>
                            <div style={{ width: `${ppct}%`, height: "100%", background: p.statusColor, borderRadius: "2px" }} />
                          </div>
                          <span style={{ fontSize: "11px", fontFamily: "IBM Plex Mono", color: "var(--text3)" }}>{ppct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: `${p.statusColor}18`, color: p.statusColor }}>
                          {ppct === 100 ? "Complete" : ppct > 0 ? "In Progress" : "Planning"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
