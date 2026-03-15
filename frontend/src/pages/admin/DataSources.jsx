import { useEffect, useState } from "react";
import axios from "axios";
import { Database, Download, RefreshCw, ExternalLink, CheckCircle2, Circle, ArrowRight } from "lucide-react";

export default function DataSources() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => { loadData(); loadStatus(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/scraper/projects");
      setProjects(data);
    } catch (_) {}
    setLoading(false);
  };

  const loadStatus = async () => {
    try {
      const { data } = await axios.get("/api/scraper/status");
      setStatus(data);
    } catch (_) {}
  };

  const downloadTrainingData = () => {
    window.open("/api/scraper/training-data", "_blank");
  };

  const pipeline = [
    { step: "1", label: "Scrape govt data", desc: "data.gov.in + smartcities.gov.in + PMGSY", done: projects.length > 0 },
    { step: "2", label: "Download JSONL", desc: "Export training_data.jsonl from this page", done: false },
    { step: "3", label: "Open Colab notebook", desc: "notebooks/finetune_phi3.ipynb in your project", done: false },
    { step: "4", label: "Fine-tune Phi-3", desc: "~20 min on free T4 GPU with Unsloth", done: false },
    { step: "5", label: "Push to HuggingFace", desc: "Free hosting at huggingface.co/models", done: false },
    { step: "6", label: "Set HF_MODEL_URL", desc: "Add URL to backend/.env, restart server", done: false },
  ];

  const statusColors = { Completed: "#4ade80", "In Progress": "#60a5fa", Tendered: "#facc15" };

  return (
    <div className="p-8 fade-up">
      <div className="mb-8">
        <div className="text-xs font-mono mb-1" style={{ color: "var(--text3)" }}>DATA SOURCES</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne" }}>
          Training <span style={{ color: "var(--amber)" }}>Data Pipeline</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
          Scraped from Indian government sources — used to fine-tune Phi-3 Mini
        </p>
      </div>

      {/* Pipeline steps */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold mb-5" style={{ fontFamily: "Syne" }}>End-to-End Pipeline</h3>
        <div className="space-y-3">
          {pipeline.map((p, i) => (
            <div key={p.step} className="flex items-start gap-4">
              <div className="flex items-center gap-2 shrink-0">
                {p.done
                  ? <CheckCircle2 size={18} style={{ color: "#4ade80" }} />
                  : <Circle size={18} style={{ color: "var(--text3)" }} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "var(--amber-glow)", color: "var(--amber)" }}>
                    Step {p.step}
                  </span>
                  <span className="font-semibold text-sm">{p.label}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{p.desc}</p>
              </div>
              {i < pipeline.length - 1 && (
                <ArrowRight size={14} style={{ color: "var(--text3)", marginTop: "2px" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button className="btn btn-amber" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Scraping…" : "Refresh Data"}
        </button>
        <button className="btn btn-ghost" onClick={downloadTrainingData}>
          <Download size={14} /> Download training_data.jsonl
        </button>
        <a
          href="https://colab.research.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
        >
          <ExternalLink size={14} /> Open Google Colab
        </a>
      </div>

      {/* Stats */}
      {status && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { l: "Sources", v: status.sources?.join(", ") || "2 sources" },
            { l: "Cached Records", v: status.cached || 0 },
            { l: "Training Pairs", v: `~${projects.length + 15} pairs` },
          ].map(({ l, v }) => (
            <div key={l} className="card p-4">
              <div className="text-xs mb-1" style={{ color: "var(--text3)" }}>{l}</div>
              <div className="font-bold text-sm" style={{ fontFamily: "Syne" }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Data table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <Database size={15} style={{ color: "var(--amber)" }} />
          <h3 className="font-bold text-sm" style={{ fontFamily: "Syne" }}>
            Smart Cities Mission Projects ({projects.length} records)
          </h3>
          <span className="text-xs ml-auto font-mono" style={{ color: "var(--text3)" }}>
            Source: smartcities.gov.in
          </span>
        </div>

        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["City", "State", "Project", "Sector", "Budget (₹ Cr)", "Duration", "Status"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left",
                    color: "var(--text3)", fontFamily: "IBM Plex Mono", fontSize: "11px",
                    fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={i} style={{
                  borderBottom: "1px solid var(--border)",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,183,43,0.02)",
                }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.city}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text2)" }}>{p.state}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text2)", maxWidth: "220px" }}>{p.project}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                      background: "var(--amber-glow)", color: "var(--amber)",
                    }}>{p.sector}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "IBM Plex Mono", color: "var(--amber)" }}>{p.cost}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text2)" }}>{p.duration ? `${p.duration} mo` : "-"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                      color: statusColors[p.status] || "var(--text3)",
                      background: `${statusColors[p.status]}18` || "transparent",
                    }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12" style={{ color: "var(--text3)" }}>
            {loading ? "Scraping data…" : "Click 'Refresh Data' to load projects"}
          </div>
        )}
      </div>

      {/* Notebook instructions */}
      <div className="card p-6 mt-6" style={{ borderColor: "var(--border2)" }}>
        <h3 className="font-bold mb-3" style={{ fontFamily: "Syne", color: "var(--amber)" }}>
          Fine-tuning Notebook — Quick Start
        </h3>
        <ol className="space-y-2 text-sm" style={{ color: "var(--text2)" }}>
          <li><b style={{ color: "var(--text)" }}>1.</b> Download <code style={{ color: "var(--amber)", fontFamily: "IBM Plex Mono" }}>training_data.jsonl</code> using the button above</li>
          <li><b style={{ color: "var(--text)" }}>2.</b> Go to <a href="https://colab.research.google.com" target="_blank" rel="noreferrer" style={{ color: "var(--amber)" }}>colab.research.google.com</a> → Upload <code style={{ fontFamily: "IBM Plex Mono", color: "var(--text)" }}>notebooks/finetune_phi3.ipynb</code></li>
          <li><b style={{ color: "var(--text)" }}>3.</b> Runtime → Change runtime type → <b style={{ color: "var(--text)" }}>T4 GPU</b> (free)</li>
          <li><b style={{ color: "var(--text)" }}>4.</b> Run all cells — training takes ~20 minutes</li>
          <li><b style={{ color: "var(--text)" }}>5.</b> The notebook pushes your model to HuggingFace automatically</li>
          <li><b style={{ color: "var(--text)" }}>6.</b> Add <code style={{ color: "var(--amber)", fontFamily: "IBM Plex Mono" }}>HF_MODEL_URL=…</code> to <code style={{ fontFamily: "IBM Plex Mono" }}>backend/.env</code></li>
          <li><b style={{ color: "var(--text)" }}>7.</b> Restart backend — engine upgrades from <span style={{ color: "var(--amber)" }}>Rule Engine</span> → <span style={{ color: "#4ade80" }}>Phi-3 Live</span></li>
        </ol>
      </div>
    </div>
  );
}
