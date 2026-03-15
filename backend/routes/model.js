import express from "express";
import axios from "axios";
import NodeCache from "node-cache";

const router = express.Router();
const cache = new NodeCache({ stdTTL: 3600 });

// ─── HuggingFace Inference ───────────────────────────────────────────────────
async function callHuggingFace(prompt) {
  const url = process.env.HF_MODEL_URL;
  const token = process.env.HF_TOKEN || "";
  if (!url) return null;

  try {
    const { data } = await axios.post(
      url,
      { inputs: prompt, parameters: { max_new_tokens: 1500, temperature: 0.3, return_full_text: false } },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, timeout: 60000 }
    );
    const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    if (!text) return null;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (err) {
    console.warn("HF call failed:", err.message);
    return null;
  }
}

// ─── Rule-based fallback (works WITHOUT any API) ─────────────────────────────
function ruleBased(projectName, projectType, description, budget, duration, location) {
  const type = (projectType || "").toLowerCase();

  const phaseTemplates = {
    "road": [
      { id: "P1", name: "Survey & Design", days: 45, tasks: ["Topographic Survey", "Soil Investigation", "Traffic Study", "Alignment Design", "Environmental Clearance"] },
      { id: "P2", name: "Land Acquisition & Approvals", days: 60, tasks: ["Land Demarcation", "Compensation Assessment", "NOC from Utilities", "Forest Clearance", "Public Hearing"] },
      { id: "P3", name: "Site Preparation", days: 30, tasks: ["Clearing & Grubbing", "Demolition", "Utility Shifting", "Construction Camp Setup", "Material Mobilization"] },
      { id: "P4", name: "Construction", days: 120, tasks: ["Earthwork & Embankment", "Sub-base Course", "Base Course", "Bituminous Layers", "Culverts & Drains", "Road Markings"] },
      { id: "P5", name: "Testing & Handover", days: 20, tasks: ["Quality Testing", "Safety Audit", "Snag List Completion", "Documentation", "Handover"] },
    ],
    "metro": [
      { id: "P1", name: "Feasibility & DPR", days: 90, tasks: ["Ridership Survey", "Alignment Study", "DPR Preparation", "Cost Estimation", "Approval from MoHUA"] },
      { id: "P2", name: "Design & Tendering", days: 60, tasks: ["Detailed Engineering Design", "Rolling Stock Specs", "Civil Works Tender", "Systems Tender", "Contract Award"] },
      { id: "P3", name: "Civil Works", days: 240, tasks: ["Piling & Foundation", "Viaduct Construction", "Station Box Excavation", "Tunnel Boring", "Station Finishing"] },
      { id: "P4", name: "Systems & Electrification", days: 120, tasks: ["Track Laying", "OHE Installation", "Signalling System", "AFC Gates", "CCTV & PA System"] },
      { id: "P5", name: "Trial Run & Commissioning", days: 60, tasks: ["System Integration Test", "Commissioner Inspection", "Trial Run", "CMRS Clearance", "Commercial Launch"] },
    ],
    "water": [
      { id: "P1", name: "Planning & Survey", days: 40, tasks: ["Demand Assessment", "Source Identification", "Hydrological Study", "DPR Preparation", "Statutory Approvals"] },
      { id: "P2", name: "Design", days: 35, tasks: ["Hydraulic Design", "Pump House Design", "Pipeline Network Design", "Treatment Plant Design", "Electrical Design"] },
      { id: "P3", name: "Procurement", days: 45, tasks: ["Pipe Procurement", "Pump Procurement", "Treatment Chemicals Setup", "SCADA System", "Meter Procurement"] },
      { id: "P4", name: "Construction", days: 90, tasks: ["Intake Works", "Treatment Plant", "Pump House", "Transmission Main", "Distribution Network", "Service Connections"] },
      { id: "P5", name: "Commissioning", days: 20, tasks: ["Flushing & Chlorination", "Pressure Testing", "Water Quality Test", "SCADA Integration", "Handover"] },
    ],
    "default": [
      { id: "P1", name: "Planning & Feasibility", days: 45, tasks: ["Needs Assessment", "Site Survey", "Feasibility Study", "DPR Preparation", "Stakeholder Consultation"] },
      { id: "P2", name: "Design & Approvals", days: 40, tasks: ["Detailed Design", "Structural Design", "MEP Design", "Regulatory Approvals", "Tender Documents"] },
      { id: "P3", name: "Procurement & Mobilization", days: 30, tasks: ["Contractor Selection", "Material Procurement", "Equipment Mobilization", "Site Setup", "Safety Planning"] },
      { id: "P4", name: "Construction", days: 120, tasks: ["Foundation Work", "Structural Work", "Finishing Work", "MEP Installation", "Landscaping"] },
      { id: "P5", name: "Testing & Commissioning", days: 25, tasks: ["Quality Inspection", "Safety Audit", "Commissioning", "Documentation", "Formal Handover"] },
    ],
  };

  const key = Object.keys(phaseTemplates).find((k) => type.includes(k)) || "default";
  const templates = phaseTemplates[key];

  const priorities = ["Critical", "High", "High", "Medium", "Low"];
  const risks = ["High", "Medium", "Medium", "Low", "Low"];
  const categories = ["Planning", "Design", "Procurement", "Construction", "Testing"];
  const teams = ["Survey Team", "Design Consultants", "Procurement Cell", "Civil Contractor", "QA/QC Team"];

  let taskCounter = 1;
  const allTaskIds = [];
  const criticalPath = [];

  const phases = templates.map((ph, pi) => {
    const phaseTasks = ph.tasks.map((taskName, ti) => {
      const id = `T${pi + 1}.${ti + 1}`;
      allTaskIds.push(id);
      const deps = ti === 0 && pi > 0 ? [`T${pi}.${templates[pi - 1].tasks.length}`] : ti > 0 ? [`T${pi + 1}.${ti}`] : [];
      if (pi < 3 && ti === 0) criticalPath.push(id);
      return {
        taskId: id,
        taskName,
        description: `Execute ${taskName} as part of ${ph.name} phase for ${projectName}.`,
        category: categories[pi] || "Construction",
        durationDays: Math.floor(ph.days / ph.tasks.length),
        estimatedCost: `₹${(Math.random() * 5 + 0.5).toFixed(1)} Cr`,
        dependencies: deps,
        assignedTeam: teams[pi] || "Project Team",
        priority: priorities[pi] || "Medium",
        riskLevel: risks[pi] || "Medium",
        riskNote: pi === 0 ? "Delays in this phase cascade to all downstream tasks" : pi === 3 ? "Weather and supply chain risks" : "Standard execution risk",
        status: "pending",
        completionPercent: 0,
        resources: ["Engineer", "Supervisor", "Labour"],
        milestoneFlag: ti === ph.tasks.length - 1,
      };
    });
    return { phaseId: ph.id, phaseName: ph.name, description: `${ph.name} phase`, durationDays: ph.days, tasks: phaseTasks };
  });

  const totalDays = templates.reduce((s, p) => s + p.days, 0);
  const budgetNum = parseFloat((budget || "100").replace(/[^0-9.]/g, "")) || 100;

  return {
    projectName,
    summary: `${projectName} is a ${projectType || "infrastructure"} project in ${location || "India"} spanning ${totalDays} days. The project involves ${phases.length} phases with structured task dependencies and a total estimated budget of ₹${budgetNum} Cr.`,
    feasibilityScore: Math.floor(Math.random() * 20 + 68),
    feasibilityBreakdown: { technical: 78, financial: 72, environmental: 65, regulatory: 70, social: 80 },
    feasibilityNotes: `Project is technically feasible with moderate financial and regulatory complexity. Environmental clearances are the key risk factor.`,
    totalEstimatedDays: totalDays,
    totalEstimatedCost: `₹${budgetNum} Cr`,
    phases,
    criticalPath,
    risks: [
      { riskId: "R1", title: "Land Acquisition Delay", description: "Delays in land acquisition can stall entire project", severity: "High", mitigation: "Engage district administration early, begin LA process in Phase 1" },
      { riskId: "R2", title: "Monsoon Season Impact", description: "Construction disruption during June–September", severity: "Medium", mitigation: "Plan earthworks before monsoon, use monsoon-proof materials" },
      { riskId: "R3", title: "Cost Overrun", description: "Material price escalation and scope changes", severity: "Medium", mitigation: "Price escalation clauses in contracts, contingency of 10%" },
      { riskId: "R4", title: "Regulatory Clearance", description: "Environmental and forest clearances can be delayed", severity: "High", mitigation: "Submit clearance applications at project start, appoint dedicated liaison" },
    ],
    recommendations: [
      "Begin land acquisition and environmental clearances simultaneously in Phase 1",
      "Schedule heavy construction outside monsoon months (Oct–May)",
      "Maintain 10% contingency budget for unforeseen items",
      "Engage local community stakeholders early to avoid protests",
      "Use BIM (Building Information Modelling) for design coordination",
    ],
    regulatoryRequirements: ["Environmental Impact Assessment (EIA)", "Forest Clearance (if applicable)", "NOC from Railways/Highways", "Local Body Approvals", "Pollution Control Board NOC"],
    sustainabilityScore: 72,
    sustainabilityNotes: "Project includes standard sustainability measures. Consider adding solar lighting, rainwater harvesting for higher score.",
    dataSource: "rule-based",
  };
}

// ─── Build prompt for Phi-3 ──────────────────────────────────────────────────
function buildPrompt(body) {
  const { projectName, projectType, description, budget, duration, location, constraints } = body;
  return `<|system|>
You are an expert Indian infrastructure project planner AI trained on government project data. Decompose projects into detailed JSON execution plans.
<|end|>
<|user|>
Decompose this infrastructure project into a JSON execution plan:
Project: ${projectName}
Type: ${projectType || "General Infrastructure"}
Description: ${description}
Budget: ${budget || "Not specified"}
Duration: ${duration || "Not specified"}
Location: ${location || "India"}
Constraints: ${constraints || "None"}

Return ONLY valid JSON with this structure:
{
  "projectName": "string",
  "summary": "string",
  "feasibilityScore": 0-100,
  "feasibilityBreakdown": {"technical":0-100,"financial":0-100,"environmental":0-100,"regulatory":0-100,"social":0-100},
  "feasibilityNotes": "string",
  "totalEstimatedDays": number,
  "totalEstimatedCost": "string",
  "phases": [{"phaseId":"P1","phaseName":"string","description":"string","durationDays":number,"tasks":[{"taskId":"T1.1","taskName":"string","description":"string","category":"Planning|Design|Procurement|Construction|Testing|Compliance|Monitoring","durationDays":number,"estimatedCost":"string","dependencies":[],"assignedTeam":"string","priority":"Critical|High|Medium|Low","riskLevel":"High|Medium|Low","riskNote":"string","status":"pending","completionPercent":0,"resources":[],"milestoneFlag":false}]}],
  "criticalPath": ["T1.1"],
  "risks": [{"riskId":"R1","title":"string","description":"string","severity":"High|Medium|Low","mitigation":"string"}],
  "recommendations": ["string"],
  "regulatoryRequirements": ["string"],
  "sustainabilityScore": 0-100,
  "sustainabilityNotes": "string"
}
<|end|>
<|assistant|>`;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/model/decompose
router.post("/decompose", async (req, res) => {
  const { projectName, description } = req.body;
  if (!projectName || !description) return res.status(400).json({ error: "projectName and description required" });

  const cacheKey = `decompose_${projectName}_${req.body.projectType}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });

  // Try HuggingFace first
  const prompt = buildPrompt(req.body);
  const hfResult = await callHuggingFace(prompt);

  if (hfResult) {
    hfResult.dataSource = "phi3-finetuned";
    cache.set(cacheKey, hfResult);
    return res.json(hfResult);
  }

  // Fallback to rule-based
  console.log("ℹ️  Using rule-based engine (HF model not configured or failed)");
  const result = ruleBased(
    projectName, req.body.projectType, description,
    req.body.budget, req.body.duration, req.body.location
  );
  cache.set(cacheKey, result);
  res.json(result);
});

// POST /api/model/chat
router.post("/chat", async (req, res) => {
  const { message, projectContext } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  const prompt = `<|system|>You are InfraBot, an expert AI for Indian infrastructure project management. Be concise and practical.<|end|>
<|user|>Context: ${projectContext || "General infrastructure"}
Question: ${message}<|end|>
<|assistant|>`;

  const hfResult = await callHuggingFace(prompt);
  if (hfResult) return res.json({ reply: typeof hfResult === "string" ? hfResult : JSON.stringify(hfResult), source: "phi3" });

  // Rule-based chat fallback
  const replies = {
    risk: "Key risks in Indian infrastructure: land acquisition delays (most common), monsoon disruptions (Jun-Sep), regulatory clearances (EIA, forest), utility shifting, and contractor capacity. Mitigation: start LA early, build weather buffers, appoint dedicated clearance liaison.",
    cost: "Cost overruns in Indian infra average 20-40%. Causes: scope creep, price escalation, design changes. Mitigation: fixed-price contracts with escalation clauses, 10% contingency, clear scope definition upfront.",
    metro: "Metro rail in India requires MoHUA approval, CMRS clearance, and ridership of 15,000+ PHPDT to be viable. DMRC/MMRDA norms apply. Budget typically ₹250-350 Cr/km for elevated, ₹500+ Cr/km for underground.",
    default: "For infrastructure projects in India, the key success factors are: early stakeholder engagement, parallel processing of clearances, strong PMU, and regular monitoring via PMIS. Follow CPWD/MoRTH/BIS standards as applicable.",
  };
  const key = Object.keys(replies).find((k) => message.toLowerCase().includes(k)) || "default";
  res.json({ reply: replies[key], source: "rule-based" });
});

// GET /api/model/status
router.get("/status", async (req, res) => {
  const hfConfigured = !!process.env.HF_MODEL_URL;
  let hfOnline = false;
  if (hfConfigured) {
    try {
      await axios.get(process.env.HF_MODEL_URL.replace("/v1/", "/"), { timeout: 5000 });
      hfOnline = true;
    } catch (_) { hfOnline = false; }
  }
  res.json({
    engine: hfConfigured ? (hfOnline ? "phi3-online" : "phi3-loading") : "rule-based",
    hfConfigured,
    hfOnline,
    message: hfConfigured
      ? hfOnline ? "Phi-3 fine-tuned model is live" : "Model is loading (cold start ~30s)"
      : "Rule-based engine active. Deploy fine-tuned model to HuggingFace and set HF_MODEL_URL to upgrade.",
  });
});

export default router;
