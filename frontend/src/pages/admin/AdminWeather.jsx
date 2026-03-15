import { useEffect, useState } from "react";
import { CloudRain, Sun, Wind, Thermometer, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import useStore from "../../store/useStore.js";
import axios from "axios";

// Monsoon risk calendar for India
const MONTHLY_RISK = {
  0:  { name:"Jan", rain:5,  risk:"Low",    temp:22, advisory:"Good construction season" },
  1:  { name:"Feb", rain:8,  risk:"Low",    temp:25, advisory:"Good construction season" },
  2:  { name:"Mar", rain:12, risk:"Low",    temp:30, advisory:"Pre-summer push recommended" },
  3:  { name:"Apr", rain:18, risk:"Medium", temp:35, advisory:"Heat stress risk for workers" },
  4:  { name:"May", rain:25, risk:"Medium", temp:38, advisory:"Pre-monsoon showers possible" },
  5:  { name:"Jun", rain:180,risk:"High",   temp:32, advisory:"⛔ Halt earthworks & excavation" },
  6:  { name:"Jul", rain:280,risk:"High",   temp:30, advisory:"⛔ Halt earthworks & excavation" },
  7:  { name:"Aug", rain:250,risk:"High",   temp:29, advisory:"⛔ Halt earthworks & excavation" },
  8:  { name:"Sep", rain:150,risk:"High",   temp:29, advisory:"⛔ Halt earthworks & excavation" },
  9:  { name:"Oct", rain:60, risk:"Medium", temp:28, advisory:"Post-monsoon drying period" },
  10: { name:"Nov", rain:20, risk:"Low",    temp:24, advisory:"Good construction season" },
  11: { name:"Dec", rain:8,  risk:"Low",    temp:20, advisory:"Peak construction season" },
};

const RISK_STYLE = {
  High:   { bg: "rgba(248,113,113,0.1)",  color: "#f87171", border: "rgba(248,113,113,0.25)" },
  Medium: { bg: "rgba(255,183,43,0.1)",   color: "#ffb72b", border: "rgba(255,183,43,0.25)" },
  Low:    { bg: "rgba(74,222,128,0.1)",   color: "#4ade80", border: "rgba(74,222,128,0.25)" },
};

function flagTasksWithWeatherRisk(tasks) {
  // Tasks with these categories are weather-sensitive
  const sensitiveCategories = ["Construction", "Procurement"];
  const sensitivePhrases = ["earthwork", "excavat", "piling", "foundation", "concrete", "road", "laying", "civil", "outdoor"];
  return tasks.map(task => {
    const isSensitive = sensitiveCategories.includes(task.category) ||
      sensitivePhrases.some(p => (task.taskName || "").toLowerCase().includes(p));
    return { ...task, weatherSensitive: isSensitive };
  });
}

export default function AdminWeather() {
  const { projects, fetchProjects } = useStore();
  const [selectedProject, setSelectedProject] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const currentMonth = new Date().getMonth();
  const currentRisk = MONTHLY_RISK[currentMonth];

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { if (projects.length && !selectedProject) setSelectedProject(projects[0]); }, [projects]);

  // Fetch real weather from Open-Meteo (free, no API key)
  useEffect(() => {
    if (!selectedProject) return;
    const location = selectedProject.location || "Mumbai";
    const cityCoords = {
      "Mumbai":{ lat:19.076,lng:72.877 }, "Delhi":{ lat:28.613,lng:77.209 },
      "Bangalore":{ lat:12.972,lng:77.594 }, "Chennai":{ lat:13.083,lng:80.270 },
      "Hyderabad":{ lat:17.385,lng:78.487 }, "Pune":{ lat:18.520,lng:73.856 },
      "Ahmedabad":{ lat:23.022,lng:72.571 },
    };
    let coords = { lat:19.076, lng:72.877 };
    for (const [city, c] of Object.entries(cityCoords)) {
      if (location.toLowerCase().includes(city.toLowerCase())) { coords = c; break; }
    }
    setWeatherLoading(true);
    axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,precipitation,windspeed_10m,weathercode&forecast_days=7&daily=precipitation_sum,temperature_2m_max`)
      .then(({ data }) => { setWeather(data); setWeatherLoading(false); })
      .catch(() => { setWeather(null); setWeatherLoading(false); });
  }, [selectedProject]);

  const allTasks = selectedProject ? flagTasksWithWeatherRisk(selectedProject.phases?.flatMap(p => p.tasks) || []) : [];
  const riskyTasks = allTasks.filter(t => t.weatherSensitive && t.status !== "completed");
  const safeTasks = allTasks.filter(t => !t.weatherSensitive && t.status !== "completed");

  const weatherCodeLabel = (code) => {
    if (code === 0) return "Clear Sky ☀️";
    if (code <= 3) return "Partly Cloudy ⛅";
    if (code <= 48) return "Foggy 🌫️";
    if (code <= 67) return "Rainy 🌧️";
    if (code <= 77) return "Snowy ❄️";
    if (code <= 82) return "Showers 🌦️";
    return "Stormy ⛈️";
  };

  return (
    <div className="p-8 fade-up">
      <div className="mb-6">
        <div className="text-xs font-mono mb-1" style={{ color: "var(--text3)" }}>ADMIN · WEATHER RISK</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne" }}>
          Weather <span style={{ color: "var(--amber)" }}>Risk Analysis</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
          Monsoon calendar + live weather — flags tasks at risk of delays
        </p>
      </div>

      {/* Current month risk banner */}
      <div className="card p-5 mb-5" style={{ borderColor: RISK_STYLE[currentRisk.risk].border, background: RISK_STYLE[currentRisk.risk].bg }}>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: RISK_STYLE[currentRisk.risk].color }}>
              CURRENT MONTH — {currentRisk.name.toUpperCase()}
            </div>
            <div className="text-2xl font-bold" style={{ fontFamily: "Syne", color: RISK_STYLE[currentRisk.risk].color }}>
              {currentRisk.risk} Weather Risk
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--text2)" }}>{currentRisk.advisory}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs" style={{ color: "var(--text3)" }}>Avg Rainfall</div>
            <div className="text-2xl font-bold" style={{ fontFamily: "Syne", color: "var(--amber)" }}>{currentRisk.rain}mm</div>
            <div className="text-xs mt-1" style={{ color: "var(--text3)" }}>Avg Temp: {currentRisk.temp}°C</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Monsoon Calendar */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Syne" }}>India Monsoon Risk Calendar</h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(MONTHLY_RISK).map(([m, data]) => {
              const isCurrent = parseInt(m) === currentMonth;
              const style = RISK_STYLE[data.risk];
              return (
                <div key={m} className="rounded-lg p-2 text-center text-xs"
                  style={{
                    background: isCurrent ? style.bg : "var(--ink3)",
                    border: `1px solid ${isCurrent ? style.border : "var(--border)"}`,
                  }}>
                  <div className="font-bold" style={{ color: isCurrent ? style.color : "var(--text2)" }}>{data.name}</div>
                  <div style={{ color: style.color, fontSize: "10px", fontFamily: "IBM Plex Mono" }}>{data.risk}</div>
                  <div style={{ color: "var(--text3)", fontSize: "10px" }}>{data.rain}mm</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live weather widget */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ fontFamily: "Syne" }}>Live Weather</h3>
            <select
              value={selectedProject?.id || ""}
              onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value))}
              style={{ width: "auto", padding: "4px 8px", fontSize: "12px" }}
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.projectName?.substring(0,25)}</option>)}
            </select>
          </div>

          {weatherLoading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text3)" }}>
              <div className="w-4 h-4 rounded-full border-2 border-t-amber-400 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--amber)" }} />
              Fetching weather…
            </div>
          )}

          {weather && !weatherLoading && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold" style={{ fontFamily: "Syne", color: "var(--amber)" }}>
                  {Math.round(weather.current?.temperature_2m || 0)}°C
                </div>
                <div>
                  <div className="text-sm font-medium">{weatherCodeLabel(weather.current?.weathercode)}</div>
                  <div className="text-xs" style={{ color: "var(--text3)" }}>
                    💨 {Math.round(weather.current?.windspeed_10m || 0)} km/h &nbsp;
                    🌧️ {weather.current?.precipitation || 0}mm
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                    {selectedProject?.location || "Mumbai, Maharashtra"}
                  </div>
                </div>
              </div>

              {/* 7-day forecast */}
              <div className="grid grid-cols-7 gap-1">
                {(weather.daily?.precipitation_sum || []).slice(0,7).map((rain, i) => {
                  const maxTemp = weather.daily?.temperature_2m_max?.[i] || 30;
                  const date = new Date(); date.setDate(date.getDate() + i);
                  const dayName = i === 0 ? "Today" : date.toLocaleDateString("en", { weekday: "short" });
                  const riskColor = rain > 20 ? "#f87171" : rain > 5 ? "#ffb72b" : "#4ade80";
                  return (
                    <div key={i} className="text-center rounded-lg p-1.5" style={{ background: "var(--ink3)" }}>
                      <div className="text-xs" style={{ color: "var(--text3)", fontSize: "9px" }}>{dayName}</div>
                      <div className="text-xs font-bold mt-0.5" style={{ color: riskColor, fontSize: "10px" }}>{rain.toFixed(0)}mm</div>
                      <div style={{ fontSize: "9px", color: "var(--text3)" }}>{Math.round(maxTemp)}°</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!weather && !weatherLoading && (
            <div className="text-sm" style={{ color: "var(--text3)" }}>
              {projects.length === 0 ? "Create a project to see weather analysis" : "Could not load weather data"}
            </div>
          )}
        </div>
      </div>

      {/* Weather-sensitive tasks */}
      {selectedProject && (
        <div className="mt-5 grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* At-risk tasks */}
          <div className="card p-5" style={{ borderColor: "rgba(248,113,113,0.25)" }}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ fontFamily: "Syne", color: "#f87171" }}>
              <AlertTriangle size={14} /> Weather-Sensitive Tasks ({riskyTasks.length})
            </h3>
            {riskyTasks.length === 0 ? (
              <div className="text-sm" style={{ color: "var(--text3)" }}>No pending weather-sensitive tasks 🎉</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {riskyTasks.map(task => (
                  <div key={task.taskId} className="p-3 rounded-lg" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs" style={{ color: "var(--amber)" }}>{task.taskId}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                        {currentRisk.risk} risk month
                      </span>
                    </div>
                    <div className="text-sm font-medium">{task.taskName}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text3)" }}>
                      {currentRisk.risk === "High" ? "⚠️ Consider rescheduling — monsoon season" : "Monitor weather conditions"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safe tasks */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ fontFamily: "Syne", color: "#4ade80" }}>
              <CheckCircle2 size={14} /> Weather-Safe Tasks ({safeTasks.length})
            </h3>
            {safeTasks.length === 0 ? (
              <div className="text-sm" style={{ color: "var(--text3)" }}>No weather-safe pending tasks</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {safeTasks.slice(0, 8).map(task => (
                  <div key={task.taskId} className="p-3 rounded-lg flex items-center gap-2" style={{ background: "var(--ink3)", border: "1px solid var(--border)" }}>
                    <CheckCircle2 size={12} style={{ color: "#4ade80", flexShrink: 0 }} />
                    <div>
                      <div className="text-sm font-medium">{task.taskName}</div>
                      <div className="text-xs" style={{ color: "var(--text3)" }}>{task.category} · Can proceed in any weather</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendation box */}
      {currentRisk.risk === "High" && (
        <div className="card p-5 mt-5" style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.04)" }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#f87171" }}>
            <AlertTriangle size={14} /> Monsoon Season Recommendations
          </h3>
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {[
              "Halt all earthworks, excavation, and soil-related tasks",
              "Focus on indoor tasks: design, procurement, approvals",
              "Waterproof and cover all exposed construction",
              "Deploy monsoon-proof site drainage systems",
              "Renegotiate contractor timelines with weather buffer clauses",
              "Stock critical materials before monsoon peaks",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text2)" }}>
                <span style={{ color: "#f87171", flexShrink: 0 }}>→</span> {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
