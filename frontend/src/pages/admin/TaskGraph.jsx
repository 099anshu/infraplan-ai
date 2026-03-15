import { useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ReactFlow, {
  Background, Controls, MiniMap, useNodesState, useEdgesState,
  addEdge, Handle, Position, MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { ArrowLeft } from "lucide-react";
import useStore from "../../store/useStore.js";

const SC = { pending: "#5a5753", "in-progress": "#60a5fa", completed: "#4ade80", blocked: "#f87171" };
const CC = { Planning: "#60a5fa", Design: "#a78bfa", Procurement: "#fb923c", Construction: "#facc15", Testing: "#4ade80", Compliance: "#f472b6", Monitoring: "#34d399" };

function TaskNode({ data }) {
  const sc = SC[data.status] || "#5a5753";
  const border = data.isCritical ? "#ffb72b" : sc;
  return (
    <div style={{
      background: "#1a1b1c", border: `1.5px solid ${border}`, borderRadius: "10px",
      padding: "10px 14px", minWidth: "155px", maxWidth: "190px",
      fontFamily: "Outfit, sans-serif",
      boxShadow: data.isCritical ? "0 0 14px rgba(255,183,43,0.35)" : `0 0 8px ${sc}22`,
    }}>
      <Handle type="target" position={Position.Left} style={{ background: sc, width: 7, height: 7, border: "none" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: CC[data.category] || "#5a5753", flexShrink: 0 }} />
        <span style={{ fontSize: "10px", color: "#5a5753", fontFamily: "IBM Plex Mono" }}>{data.taskId}</span>
        {data.milestoneFlag && <span style={{ fontSize: "10px" }}>⭐</span>}
        {data.isCritical && (
          <span style={{ fontSize: "9px", color: "#ffb72b", background: "rgba(255,183,43,0.1)", padding: "1px 4px", borderRadius: "3px", marginLeft: "auto" }}>
            CRIT
          </span>
        )}
      </div>

      <div style={{ fontSize: "12px", fontWeight: 600, color: "#f0ede8", lineHeight: 1.35, marginBottom: "6px" }}>
        {data.taskName}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
        <span style={{ color: sc, fontWeight: 600 }}>{data.status}</span>
        <span style={{ color: "#5a5753" }}>{data.durationDays}d</span>
      </div>

      <div style={{ marginTop: "5px", height: "2px", borderRadius: "1px", background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: "100%", borderRadius: "1px", width: `${data.completionPercent || 0}%`, background: data.completionPercent === 100 ? "#4ade80" : "#ffb72b" }} />
      </div>

      <Handle type="source" position={Position.Right} style={{ background: sc, width: 7, height: 7, border: "none" }} />
    </div>
  );
}

const nodeTypes = { taskNode: TaskNode };

function buildGraph(project) {
  if (!project?.phases) return { nodes: [], edges: [] };
  const allTasks = project.phases.flatMap((p) => p.tasks);
  const taskMap = Object.fromEntries(allTasks.map((t) => [t.taskId, t]));
  const criticalSet = new Set(project.criticalPath || []);

  const nodes = [];
  project.phases.forEach((phase, pi) => {
    phase.tasks.forEach((task, ti) => {
      nodes.push({
        id: task.taskId,
        type: "taskNode",
        position: { x: pi * 270, y: ti * 120 },
        data: { ...task, isCritical: criticalSet.has(task.taskId) },
      });
    });
  });

  const edges = [];
  allTasks.forEach((task) => {
    (task.dependencies || []).forEach((depId) => {
      if (taskMap[depId]) {
        const isCrit = criticalSet.has(task.taskId) && criticalSet.has(depId);
        edges.push({
          id: `${depId}->${task.taskId}`,
          source: depId, target: task.taskId,
          animated: isCrit,
          style: { stroke: isCrit ? "#ffb72b" : "rgba(255,183,43,0.25)", strokeWidth: isCrit ? 2 : 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: isCrit ? "#ffb72b" : "rgba(255,183,43,0.4)" },
        });
      }
    });
  });

  return { nodes, edges };
}

export default function TaskGraph() {
  const { id } = useParams();
  const { currentProject, fetchProject } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => { if (!currentProject || currentProject.id !== id) fetchProject(id); }, [id]);
  useEffect(() => { if (currentProject) { const { nodes: n, edges: e } = buildGraph(currentProject); setNodes(n); setEdges(e); } }, [currentProject]);
  const onConnect = useCallback((p) => setEdges((es) => addEdge(p, es)), []);

  const allTasks = currentProject?.phases?.flatMap((p) => p.tasks) || [];
  const statusCounts = allTasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0e0f0f" }}>
      {/* Top bar */}
      <div style={{
        padding: "10px 20px", display: "flex", alignItems: "center", gap: "14px",
        background: "#1a1b1c", borderBottom: "1px solid rgba(255,183,43,0.12)", flexShrink: 0,
      }}>
        <Link to={`/project/${id}`}>
          <button style={{ display: "flex", alignItems: "center", gap: "5px", color: "#5a5753", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>
            <ArrowLeft size={13} /> Back
          </button>
        </Link>
        <div style={{ width: 1, height: 18, background: "rgba(255,183,43,0.15)" }} />
        <div style={{ fontFamily: "Syne", fontSize: "18px", fontWeight: 700, color: "#f0ede8" }}>
          Task Dependency Graph
        </div>
        <div style={{ fontFamily: "Outfit", fontSize: "12px", color: "#5a5753" }}>
          {currentProject?.projectName}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "14px", flexWrap: "wrap" }}>
          {Object.entries(SC).map(([s, c]) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#9a9690", fontFamily: "IBM Plex Mono" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
              {s} ({statusCounts[s] || 0})
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#ffb72b", fontFamily: "IBM Plex Mono" }}>
            ★ critical ({currentProject?.criticalPath?.length || 0})
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.2 }}
          style={{ background: "#0e0f0f" }}
        >
          <Background color="rgba(255,183,43,0.04)" gap={44} size={1} />
          <Controls />
          <MiniMap nodeColor={(n) => SC[n.data?.status] || "#5a5753"} />
        </ReactFlow>
      </div>

      {/* Phase legend */}
      <div style={{
        padding: "8px 20px", background: "#1a1b1c",
        borderTop: "1px solid rgba(255,183,43,0.12)",
        display: "flex", gap: "12px", flexShrink: 0, overflowX: "auto", alignItems: "center",
      }}>
        <span style={{ fontSize: "11px", color: "#5a5753", fontFamily: "IBM Plex Mono" }}>Phases:</span>
        {currentProject?.phases?.map((ph) => (
          <span key={ph.phaseId} style={{
            fontSize: "11px", color: "#ffb72b", fontFamily: "IBM Plex Mono",
            background: "rgba(255,183,43,0.06)", padding: "2px 8px", borderRadius: "4px",
            border: "1px solid rgba(255,183,43,0.15)", whiteSpace: "nowrap",
          }}>
            {ph.phaseId} · {ph.phaseName}
          </span>
        ))}
      </div>
    </div>
  );
}
