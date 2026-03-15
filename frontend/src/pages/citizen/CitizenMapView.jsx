import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import useStore from "../../store/useStore.js";

const CITY_COORDS = {
  "Mumbai":{ lat:19.076,lng:72.877 },"Delhi":{ lat:28.613,lng:77.209 },
  "Bangalore":{ lat:12.972,lng:77.594 },"Chennai":{ lat:13.083,lng:80.270 },
  "Hyderabad":{ lat:17.385,lng:78.487 },"Pune":{ lat:18.520,lng:73.856 },
  "Ahmedabad":{ lat:23.022,lng:72.571 },"Kolkata":{ lat:22.572,lng:88.363 },
  "Jaipur":{ lat:26.912,lng:75.787 },"Surat":{ lat:21.170,lng:72.831 },
  "Nagpur":{ lat:21.145,lng:79.082 },"Indore":{ lat:22.719,lng:75.857 },
  "Kochi":{ lat:9.931,lng:76.267 },"Chandigarh":{ lat:30.733,lng:76.779 },
  "Kanyakumari":{ lat:8.08,lng:77.55 },"Thiruvananthapuram":{ lat:8.524,lng:76.936 },
  "Madurai":{ lat:9.925,lng:78.119 },"Coimbatore":{ lat:11.016,lng:76.955 },
  "Visakhapatnam":{ lat:17.686,lng:83.218 },"Mangalore":{ lat:12.914,lng:74.856 },
  "Mysore":{ lat:12.295,lng:76.639 },"Goa":{ lat:15.491,lng:73.827 },
};

const INDIA_BOUNDS = { minLat:6,maxLat:38,minLng:67,maxLng:98 };

function toSVG(coords) {
  return {
    x: ((coords.lng-INDIA_BOUNDS.minLng)/(INDIA_BOUNDS.maxLng-INDIA_BOUNDS.minLng))*100,
    y: 100-(((coords.lat-INDIA_BOUNDS.minLat)/(INDIA_BOUNDS.maxLat-INDIA_BOUNDS.minLat))*100),
  };
}

function getCoords(location) {
  if (!location) return { lat:19.076, lng:72.877 };
  for (const [city,coords] of Object.entries(CITY_COORDS)) {
    if (location.toLowerCase().includes(city.toLowerCase())) return coords;
  }
  return { lat:19.076+(Math.random()-0.5)*8, lng:72.877+(Math.random()-0.5)*8 };
}

function getColor(pct) {
  if (pct >= 80) return "#4ade80";
  if (pct >= 40) return "#60a5fa";
  return "#ffb72b";
}

export default function CitizenMapView() {
  const { projects, fetchProjects } = useStore();
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchProjects(); }, []);

  const projectsPlotted = projects.map(p => {
    const tasks = p.phases?.flatMap(ph => ph.tasks) || [];
    const done = tasks.filter(t => t.status==="completed").length;
    const pct = tasks.length ? Math.round((done/tasks.length)*100) : 0;
    return { ...p, coords: getCoords(p.location), pct, color: getColor(pct) };
  });

  const selTasks = selected?.phases?.flatMap(p => p.tasks) || [];
  const selDone = selTasks.filter(t => t.status==="completed").length;

  return (
    <div className="p-6 max-w-5xl mx-auto fade-up">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily:"Syne" }}>
          Projects Near <span style={{ color:"#60a5fa" }}>You</span>
        </h1>
        <p className="text-sm mt-1" style={{ color:"var(--text2)" }}>
          Infrastructure projects across India — tap any marker to learn more
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {[["#4ade80","80%+ complete"],["#60a5fa","In progress"],["#ffb72b","Early stage"]].map(([c,l]) => (
          <div key={l} className="flex items-center gap-2 text-xs" style={{ color:"var(--text3)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background:c }} /> {l}
          </div>
        ))}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: selected ? "1fr 300px" : "1fr" }}>
        {/* SVG Map */}
        <div className="card overflow-hidden">
          {projects.length === 0 ? (
            <div className="flex items-center justify-center flex-col gap-3 p-16">
              <MapPin size={40} style={{ color:"var(--text3)" }} />
              <p style={{ color:"var(--text3)" }}>No projects yet — check back soon!</p>
            </div>
          ) : (
            <div style={{ position:"relative", width:"100%", paddingBottom:"75%", background:"#0a1628" }}>
              <svg viewBox="0 0 100 75" style={{ position:"absolute",inset:0,width:"100%",height:"100%" }} preserveAspectRatio="xMidYMid meet">
                <rect width="100" height="75" fill="#0a1628" />
                <text x="50" y="38" textAnchor="middle" fill="rgba(96,165,250,0.05)" fontSize="16" fontFamily="Syne" fontWeight="bold">INDIA</text>
                {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="75" stroke="rgba(96,165,250,0.04)" strokeWidth="0.3" />)}
                {[18,36,54,72].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(96,165,250,0.04)" strokeWidth="0.3" />)}

                {Object.entries(CITY_COORDS).map(([city,coords]) => {
                  const { x,y } = toSVG(coords);
                  return <text key={city} x={x} y={y} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="1.8" fontFamily="Outfit">{city}</text>;
                })}

                {projectsPlotted.map(p => {
                  const { x,y } = toSVG(p.coords);
                  const isSelected = selected?.id === p.id;
                  return (
                    <g key={p.id} style={{ cursor:"pointer" }} onClick={() => setSelected(isSelected ? null : p)}>
                      <circle cx={x} cy={y} r={isSelected?3.5:2.5} fill={p.color} opacity="0.2">
                        <animate attributeName="r" values={`${isSelected?3.5:2.5};${isSelected?5:4};${isSelected?3.5:2.5}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={x} cy={y} r={isSelected?2.2:1.6} fill={p.color} stroke={isSelected?"white":"none"} strokeWidth="0.4" />
                      <text x={x} y={y-2.8} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="1.5" fontFamily="Outfit" fontWeight="600">
                        {(p.projectName||"").substring(0,14)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div style={{ position:"absolute",bottom:"8px",right:"10px",fontSize:"9px",color:"rgba(96,165,250,0.3)",fontFamily:"IBM Plex Mono" }}>N ↑</div>
            </div>
          )}
          <div className="p-3 text-xs text-center" style={{ color:"var(--text3)", borderTop:"1px solid var(--border)" }}>
            {projects.length} infrastructure projects across India · Click a marker for details
          </div>
        </div>

        {/* Selected project card */}
        {selected && (
          <div className="card p-5 fade-up space-y-4" style={{ alignSelf:"start" }}>
            <div>
              <div className="text-xs font-mono mb-1" style={{ color:"var(--text3)" }}>PROJECT INFO</div>
              <h3 className="font-bold" style={{ fontFamily:"Syne" }}>{selected.projectName}</h3>
              {selected.projectType && (
                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa" }}>
                  {selected.projectType}
                </span>
              )}
              <p className="text-xs mt-2 leading-relaxed" style={{ color:"var(--text2)" }}>
                {selected.summary?.substring(0,150)}…
              </p>
            </div>

            {/* Progress ring visual */}
            <div className="flex items-center gap-4">
              <div style={{ position:"relative", width:"64px", height:"64px", flexShrink:0 }}>
                <svg viewBox="0 0 36 36" style={{ width:"100%", height:"100%", transform:"rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={selected.color} strokeWidth="3"
                    strokeDasharray={`${selected.pct} ${100-selected.pct}`} strokeLinecap="round" />
                </svg>
                <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,fontFamily:"Syne",color:selected.color }}>
                  {selected.pct}%
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div style={{ color:"var(--text3)" }}>💰 {selected.totalEstimatedCost}</div>
                <div style={{ color:"var(--text3)" }}>⏱ {selected.totalEstimatedDays} days</div>
                <div style={{ color:"var(--text3)" }}>📍 {selected.location || "India"}</div>
                <div style={{ color:"var(--text3)" }}>✅ {selDone}/{selTasks.length} tasks done</div>
              </div>
            </div>

            <Link to={`/citizen/project/${selected.id}`}>
              <button className="btn w-full justify-center"
  style={{ background:"#3b82f6", color:"white", border:"none", marginTop:"12px" }}>
                View Full Details <ChevronRight size={14} />
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Project list */}
      <div className="mt-5 space-y-2">
        <h2 className="font-bold text-sm mb-3" style={{ fontFamily:"Syne" }}>All Projects</h2>
        {projectsPlotted.map(p => (
          <Link key={p.id} to={`/citizen/project/${p.id}`} style={{ textDecoration:"none" }}>
            <div className="card p-4 flex items-center gap-3 transition-all hover:border-blue-500/20 group">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background:p.color }} />
              <span className="font-medium text-sm flex-1">{p.projectName}</span>
              <span className="text-xs" style={{ color:"var(--text3)" }}>{p.location || "India"}</span>
              <span className="font-mono text-xs font-bold" style={{ color:p.color }}>{p.pct}%</span>
              <ChevronRight size={14} style={{ color:"var(--text3)" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
