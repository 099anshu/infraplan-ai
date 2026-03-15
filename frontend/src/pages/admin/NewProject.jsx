import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, AlertCircle, ChevronRight, CheckCircle2, Cpu } from "lucide-react";
import useStore from "../../store/useStore.js";

const PROJECT_TYPES = [
  "Road & Highway", "Metro Rail", "Smart Water System", "Smart Grid",
  "Urban Housing", "Sewage & Drainage", "Bridge Construction",
  "Airport Infrastructure", "Smart City Hub", "Renewable Energy Plant",
  "Flyover / Overpass", "Coastal Management",
];

export default function NewProject() {
  const navigate = useNavigate();
  const { decomposeProject, saveProject, loading, error, modelStatus } = useStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    projectName: "", projectType: "", description: "",
    budget: "", duration: "", location: "Mumbai, Maharashtra", constraints: "",
  });
  const [preview, setPreview] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    try {
      const data = await decomposeProject(form);
      setPreview(data);
      setStep(2);
    } catch (_) {}
  };

  const save = async () => {
    const saved = await saveProject({ ...form, ...preview });
    navigate(`/project/${saved.id}`);
  };

  const Label = ({ children }) => (
    <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase" style={{ color: "var(--text3)" }}>
      {children}
    </label>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto fade-up">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs font-mono mb-1" style={{ color: "var(--text3)" }}>NEW PROJECT</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne" }}>
          Generate <span style={{ color: "var(--amber)" }}>Execution Plan</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
          Describe your project — the AI engine will decompose it into a full task graph
        </p>
      </div>

      {/* Engine badge */}
      {modelStatus && (
        <div className="flex items-center gap-2 mb-5 text-xs px-3 py-2 rounded-lg w-fit"
          style={{ background: "var(--ink3)", border: "1px solid var(--border)", color: "var(--text3)" }}>
          <Cpu size={11} style={{ color: "var(--amber)" }} />
          Engine: <span style={{ color: "var(--amber)" }}>{modelStatus.engine}</span>
          {modelStatus.engine === "rule-based" && " — upgrade by deploying Phi-3 to HuggingFace"}
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center gap-3 mb-6">
        {["Project Details", "Review & Save"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step > i + 1 ? "#4ade80" : step === i + 1 ? "var(--amber)" : "var(--ink3)",
                color: step >= i + 1 ? "#0e0f0f" : "var(--text3)",
              }}>
              {step > i + 1 ? <CheckCircle2 size={12} /> : i + 1}
            </div>
            <span className="text-sm" style={{ color: step === i + 1 ? "var(--text)" : "var(--text3)" }}>{s}</span>
            {i < 1 && <ChevronRight size={12} style={{ color: "var(--text3)" }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Project Name *</Label>
              <input placeholder="e.g. Mumbai Metro Line 7" value={form.projectName} onChange={(e) => set("projectName", e.target.value)} />
            </div>
            <div>
              <Label>Project Type</Label>
              <select value={form.projectType} onChange={(e) => set("projectType", e.target.value)}>
                <option value="">Select type…</option>
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <textarea
              rows={4}
              placeholder="Describe the project in detail — scope, objectives, key deliverables, target area, beneficiaries…"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>More detail = better AI output</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Budget</Label>
              <input placeholder="₹500 Crore" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
            </div>
            <div>
              <Label>Duration</Label>
              <input placeholder="24 months" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
            </div>
            <div>
              <Label>Location</Label>
              <input placeholder="City, State" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Constraints / Special Notes</Label>
            <textarea
              rows={2}
              placeholder="Monsoon restrictions, heritage zones, displacement concerns, seismic zone…"
              value={form.constraints}
              onChange={(e) => set("constraints", e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            className="btn btn-amber w-full justify-center py-3 text-base"
            onClick={generate}
            disabled={loading || !form.projectName || !form.description}
          >
            {loading ? (
              <><Loader2 size={17} className="animate-spin" /> Generating Plan…</>
            ) : (
              <><Sparkles size={17} /> Generate AI Execution Plan</>
            )}
          </button>
        </div>
      )}

      {step === 2 && preview && (
        <div className="space-y-4 fade-up">
          {/* Feasibility */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold" style={{ fontFamily: "Syne" }}>Feasibility Analysis</h3>
              {preview.dataSource && (
                <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{ background: "rgba(255,183,43,0.1)", color: "var(--amber)", border: "1px solid var(--border2)" }}>
                  via {preview.dataSource}
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 mb-3">
              <div className="text-center">
                <div className="text-5xl font-bold" style={{
                  fontFamily: "Syne",
                  color: preview.feasibilityScore >= 75 ? "#4ade80" : preview.feasibilityScore >= 55 ? "#facc15" : "#f87171"
                }}>
                  {preview.feasibilityScore}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>/ 100</div>
              </div>
              <div className="flex-1 grid grid-cols-5 gap-2 text-center">
                {Object.entries(preview.feasibilityBreakdown || {}).map(([key, val]) => (
                  <div key={key}>
                    <div className="font-bold text-sm" style={{ color: val >= 70 ? "#4ade80" : val >= 50 ? "#facc15" : "#f87171" }}>{val}</div>
                    <div className="text-xs capitalize mt-0.5" style={{ color: "var(--text3)" }}>{key.slice(0, 5)}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--text2)" }}>{preview.feasibilityNotes}</p>
          </div>

          {/* Summary stats */}
          <div className="card p-5">
            <h3 className="font-bold mb-3" style={{ fontFamily: "Syne" }}>Plan Summary</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text2)" }}>{preview.summary}</p>
            <div className="flex gap-6 text-sm flex-wrap">
              <span style={{ color: "var(--text3)" }}>⏱ <b style={{ color: "var(--text)" }}>{preview.totalEstimatedDays}</b> days</span>
              <span style={{ color: "var(--text3)" }}>💰 <b style={{ color: "var(--text)" }}>{preview.totalEstimatedCost}</b></span>
              <span style={{ color: "var(--text3)" }}>📋 <b style={{ color: "var(--text)" }}>{preview.phases?.reduce((a, p) => a + p.tasks.length, 0)}</b> tasks</span>
              <span style={{ color: "var(--text3)" }}>🔗 <b style={{ color: "var(--text)" }}>{preview.criticalPath?.length}</b> critical steps</span>
            </div>
          </div>

          {/* Phases preview */}
          <div className="card p-5">
            <h3 className="font-bold mb-3" style={{ fontFamily: "Syne" }}>{preview.phases?.length} Phases Generated</h3>
            <div className="space-y-2">
              {preview.phases?.map((ph) => (
                <div key={ph.phaseId} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "var(--ink3)", border: "1px solid var(--border)" }}>
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "var(--amber-glow)", color: "var(--amber)" }}>
                    {ph.phaseId}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{ph.phaseName}</div>
                    <div className="text-xs" style={{ color: "var(--text3)" }}>{ph.tasks.length} tasks · {ph.durationDays} days</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn btn-ghost flex-1 justify-center" onClick={() => setStep(1)}>
              ← Back & Regenerate
            </button>
            <button className="btn btn-amber flex-1 justify-center" onClick={save}>
              Save & Open Project →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
