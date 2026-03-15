import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const projects = new Map();

router.get("/", (req, res) => {
  res.json(Array.from(projects.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.get("/:id", (req, res) => {
  const p = projects.get(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

router.post("/", (req, res) => {
  const id = uuidv4();
  const project = { ...req.body, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  projects.set(id, project);
  res.status(201).json(project);
});

router.put("/:id", (req, res) => {
  const existing = projects.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });
  const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
  projects.set(req.params.id, updated);
  res.json(updated);
});

router.patch("/:projectId/tasks/:taskId", (req, res) => {
  const project = projects.get(req.params.projectId);
  if (!project) return res.status(404).json({ error: "Not found" });
  let found = false;
  project.phases = project.phases.map((phase) => ({
    ...phase,
    tasks: phase.tasks.map((task) => {
      if (task.taskId === req.params.taskId) { found = true; return { ...task, ...req.body }; }
      return task;
    }),
  }));
  if (!found) return res.status(404).json({ error: "Task not found" });
  project.updatedAt = new Date().toISOString();
  projects.set(req.params.projectId, project);
  res.json(project);
});

router.delete("/:id", (req, res) => {
  if (!projects.has(req.params.id)) return res.status(404).json({ error: "Not found" });
  projects.delete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
