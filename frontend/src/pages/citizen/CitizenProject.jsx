import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Bot, User, AlertTriangle, CheckCircle2, Clock, TrendingUp, MessageCircle } from "lucide-react";
import axios from "axios";
import useStore from "../../store/useStore.js";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#4ade80","#60a5fa","#ffb72b","#f87171","#a78bfa","#f472b6"];

function StatCard({ label, value, color }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl font-bold" style={{ fontFamily:"Syne", color }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color:"var(--text3)" }}>{label}</div>
    </div>
  );
}

export default function CitizenProject() {
  const { id } = useParams();
  const { currentProject, fetchProject } = useStore();
  const [chatMessages, setChatMessages] = useState([
    { role:"assistant", content:"Hi! I'm InfraBot. Ask me anything about this project — timelines, costs, risks, or progress updates.", id:0 }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { fetchProject(id); }, [id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    const userMsg = { role:"user", content:msg, id:Date.now() };
    setChatMessages(m => [...m, userMsg]);

    try {
      const context = currentProject
        ? `Project: ${currentProject.projectName}. Summary: ${currentProject.summary}. Feasibility: ${currentProject.feasibilityScore}/100. Budget: ${currentProject.totalEstimatedCost}. Duration: ${currentProject.totalEstimatedDays} days. Risks: ${currentProject.risks?.map(r=>r.title).join(", ")}.`
        : "General infrastructure project";
      const { data } = await axios.post("/api/model/chat", { message: msg, projectContext: context });
      setChatMessages(m => [...m, { role:"assistant", content:data.reply, id:Date.now()+1 }]);
    } catch (_) {
      setChatMessages(m => [...m, { role:"assistant", content:"Sorry, I couldn't connect right now. Please try again.", id:Date.now()+1 }]);
    }
    setSending(false);
  };

  if (!currentProject) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center"><div className="text-4xl mb-3">⚙️</div><p style={{color:"var(--text3)"}}>Loading…</p></div>
    </div>
  );

  const allTasks = currentProject.phases?.flatMap(p => p.tasks) || [];
  const done = allTasks.filter(t => t.status==="completed").length;
  const inProgress = allTasks.filter(t => t.status==="in-progress").length;
  const blocked = allTasks.filter(t => t.status==="blocked").length;
  const pct = allTasks.length ? Math.round((done/allTasks.length)*100) : 0;

  const radarData = Object.entries(currentProject.feasibilityBreakdown || {}).map(([k,v]) => ({
    subject: k.charAt(0).toUpperCase()+k.slice(1), value:v
  }));

  const statusPie = [
    { name:"Completed", value:done },
    { name:"In Progress", value:inProgress },
    { name:"Pending", value:allTasks.length-done-inProgress-blocked },
    { name:"Blocked", value:blocked },
  ].filter(d => d.value > 0);

  const catMap = {};
  allTasks.forEach(t => { catMap[t.category] = (catMap[t.category]||0)+1; });
  const catData = Object.entries(catMap).map(([name,value]) => ({ name,value }));

  const TT = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return <div style={{background:"#252628",border:"1px solid rgba(255,183,43,0.2)",borderRadius:"8px",padding:"8px 12px",fontSize:"12px"}}>{payload.map(p=><p key={p.name} style={{color:p.color}}>{p.name}: {p.value}</p>)}</div>;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 fade-up">
      {/* Back */}
      <Link to="/citizen" style={{ display:"inline-flex", alignItems:"center", gap:"6px", fontSize:"13px", color:"var(--text3)", textDecoration:"none", marginBottom:"16px" }}>
        <ArrowLeft size={14} /> All Projects
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily:"Syne" }}>{currentProject.projectName}</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color:"var(--text2)", maxWidth:"680px" }}>{currentProject.summary}</p>
        <div className="flex gap-4 mt-3 text-xs flex-wrap" style={{ color:"var(--text3)" }}>
          <span>📍 {currentProject.location || "India"}</span>
          <span>💰 {currentProject.totalEstimatedCost}</span>
          <span>⏱ {currentProject.totalEstimatedDays} days</span>
          <span>♻️ Sustainability: {currentProject.sustainabilityScore}/100</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Feasibility" value={`${currentProject.feasibilityScore}/100`} color={currentProject.feasibilityScore>=75?"#4ade80":"#ffb72b"} />
        <StatCard label="Tasks Done" value={`${done}/${allTasks.length}`} color="#60a5fa" />
        <StatCard label="Progress" value={`${pct}%`} color={pct>66?"#4ade80":pct>33?"#ffb72b":"#f87171"} />
        <StatCard label="High Risks" value={currentProject.risks?.filter(r=>r.severity==="High").length||0} color="#f87171" />
      </div>

      {/* Progress bar */}
      <div className="card p-4 mb-5">
        <div className="flex justify-between text-xs mb-2" style={{ color:"var(--text3)" }}>
          <span>Overall Project Progress</span><span>{done} of {allTasks.length} tasks complete</span>
        </div>
        <div style={{ height:"10px", borderRadius:"5px", overflow:"hidden", background:"var(--ink3)" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#60a5fa,#4ade80)", transition:"width 1s ease" }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs" style={{ color:"var(--text3)" }}>
          {[["#4ade80",`${done} Completed`],["#60a5fa",`${inProgress} In Progress`],["#5a5753",`${allTasks.length-done-inProgress-blocked} Pending`],["#f87171",`${blocked} Blocked`]].map(([c,l])=>(
            <span key={l} className="flex items-center gap-1"><span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}} />{l}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns:"1fr 1fr" }}>
        {/* Feasibility radar */}
        {radarData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily:"Syne" }}>Feasibility Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(96,165,250,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill:"#5a5753",fontSize:11,fontFamily:"IBM Plex Mono" }} />
                <Radar name="Score" dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.12} />
                <Tooltip content={<TT />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Task status pie */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily:"Syne" }}>Task Status</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {statusPie.map((_,i) => <Cell key={i} fill={["#4ade80","#60a5fa","#5a5753","#f87171"][i]||COLORS[i]} />)}
                </Pie>
                <Tooltip content={<TT />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {statusPie.map((d,i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span style={{ width:8,height:8,borderRadius:"50%",background:["#4ade80","#60a5fa","#5a5753","#f87171"][i],flexShrink:0 }} />
                  <span style={{color:"var(--text2)"}}>{d.name}</span>
                  <span className="ml-auto font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phases timeline - read-only */}
      <div className="card p-5 mb-5">
        <h3 className="font-bold text-sm mb-4" style={{ fontFamily:"Syne" }}>Project Phases</h3>
        <div className="space-y-3">
          {currentProject.phases?.map((phase, i) => {
            const ptasks = phase.tasks || [];
            const pdone = ptasks.filter(t=>t.status==="completed").length;
            const ppct = ptasks.length ? Math.round((pdone/ptasks.length)*100) : 0;
            const pcolor = ppct===100?"#4ade80":ppct>0?"#60a5fa":"#5a5753";
            return (
              <div key={phase.phaseId} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background:ppct===100?"rgba(74,222,128,0.15)":"var(--ink3)", color:pcolor, border:`1px solid ${pcolor}40` }}>
                  {ppct===100 ? "✓" : i+1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{phase.phaseName}</span>
                    <span className="text-xs font-mono" style={{ color:pcolor }}>{ppct}%</span>
                  </div>
                  <div style={{ height:"4px", borderRadius:"2px", background:"var(--ink3)" }}>
                    <div style={{ width:`${ppct}%`, height:"100%", background:pcolor, borderRadius:"2px", transition:"width 0.8s" }} />
                  </div>
                  <div className="text-xs mt-1" style={{ color:"var(--text3)" }}>
                    {pdone}/{ptasks.length} tasks · {phase.durationDays} days
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risks - citizen-friendly */}
      {currentProject.risks?.length > 0 && (
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-sm mb-4" style={{ fontFamily:"Syne" }}>Identified Risks & Mitigations</h3>
          <div className="space-y-3">
            {currentProject.risks.map(r => {
              const rc = r.severity==="High"?"#f87171":r.severity==="Medium"?"#ffb72b":"#4ade80";
              return (
                <div key={r.riskId} className="p-3 rounded-lg" style={{ background:"var(--ink3)", border:"1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background:`${rc}18`, color:rc }}>{r.severity}</span>
                    <span className="font-semibold text-sm">{r.title}</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color:"var(--text2)" }}>{r.description}</p>
                  <p className="text-xs" style={{ color:"#4ade80" }}>↳ Mitigation: {r.mitigation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {currentProject.recommendations?.length > 0 && (
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily:"Syne" }}>What Experts Recommend</h3>
          <ul className="space-y-2">
            {currentProject.recommendations.map((r,i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span style={{color:"#60a5fa"}}>→</span>
                <span style={{color:"var(--text2)"}}>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chat with AI */}
      <div className="card overflow-hidden">
        <div className="p-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--border)", background:"rgba(96,165,250,0.05)" }}>
          <div style={{ width:"32px",height:"32px",borderRadius:"8px",background:"rgba(96,165,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <MessageCircle size={15} style={{ color:"#60a5fa" }} />
          </div>
          <div>
            <div className="font-bold text-sm">Ask About This Project</div>
            <div className="text-xs" style={{ color:"var(--text3)" }}>Get plain-language answers about timelines, costs, and impact</div>
          </div>
        </div>

        <div style={{ height:"280px", overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:"10px" }}>
          {chatMessages.map(msg => (
            <div key={msg.id} style={{ display:"flex", gap:"7px", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
              {msg.role==="assistant" && (
                <div style={{ width:"24px",height:"24px",borderRadius:"7px",background:"rgba(96,165,250,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px" }}>
                  <Bot size={11} color="#60a5fa" />
                </div>
              )}
              <div style={{
                maxWidth:"80%", fontSize:"13px", lineHeight:1.55, padding:"9px 12px",
                background:msg.role==="user"?"rgba(96,165,250,0.1)":"rgba(255,255,255,0.04)",
                color:"var(--text)",
                border:msg.role==="user"?"1px solid rgba(96,165,250,0.2)":"1px solid rgba(255,255,255,0.05)",
                borderRadius:msg.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px",
              }}>
                {msg.content}
              </div>
              {msg.role==="user" && (
                <div style={{ width:"24px",height:"24px",borderRadius:"7px",background:"rgba(255,183,43,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px" }}>
                  <User size={11} color="#ffb72b" />
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div style={{ display:"flex",gap:"7px" }}>
              <div style={{ width:"24px",height:"24px",borderRadius:"7px",background:"rgba(96,165,250,0.12)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <Bot size={11} color="#60a5fa" />
              </div>
              <div style={{ padding:"10px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:"4px" }}>
                {[0,1,2].map(i => <span key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#60a5fa",display:"inline-block",animation:"dot-pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.18}s` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ padding:"10px 12px", borderTop:"1px solid var(--border)", display:"flex", gap:"8px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter") send(); }}
            placeholder="Ask about project timeline, cost, impact on your area…"
            style={{ flex:1, padding:"9px 12px", fontSize:"13px" }}
          />
          <button onClick={send} disabled={!input.trim()||sending}
            style={{
              width:"38px", height:"38px", borderRadius:"9px", flexShrink:0,
              background:input.trim()?"#3b82f6":"rgba(96,165,250,0.1)",
              border:"none", cursor:input.trim()?"pointer":"default",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
            <Send size={14} color={input.trim()?"white":"#5a5753"} />
          </button>
        </div>

        {/* Quick questions */}
        <div className="px-3 pb-3 flex gap-2 flex-wrap">
          {["When will this project complete?","How does this affect my area?","What are the main risks?","Is the project on budget?"].map(q => (
            <button key={q} onClick={() => setInput(q)}
              style={{ fontSize:"11px", padding:"5px 10px", borderRadius:"6px", background:"var(--ink3)", border:"1px solid var(--border)", color:"var(--text3)", cursor:"pointer", fontFamily:"Outfit" }}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
