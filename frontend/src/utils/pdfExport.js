// pdfExport.js — Professional PDF report generator using jsPDF + autoTable
// Usage: import { exportProjectPDF } from "../utils/pdfExport.js"

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function parseCost(str) {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export async function exportProjectPDF(project) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const allTasks = project.phases?.flatMap((p) => p.tasks) || [];
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const blockedTasks = allTasks.filter((t) => t.status === "blocked").length;
  const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ── Color palette ────────────────────────────────────────────────────────────
  const AMBER = [255, 183, 43];
  const DARK = [14, 15, 15];
  const DARK2 = [26, 27, 28];
  const LIGHT = [240, 237, 232];
  const MUTED = [154, 150, 144];
  const GREEN = [74, 222, 128];
  const RED = [248, 113, 113];

  let y = 0;

  // ── Cover page ───────────────────────────────────────────────────────────────
  // Header band
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 60, "F");

  // Amber accent bar
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, 4, 60, "F");

  // Title
  doc.setTextColor(...AMBER);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INFRAPLAN AI", 14, 22);

  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Smart Infrastructure & Urban Management — SIH 2024", 14, 30);

  doc.setTextColor(...LIGHT);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(project.projectName || "Project Report", W - 28);
  doc.text(nameLines, 14, 46);

  // Meta row
  y = 70;
  doc.setFillColor(...DARK2);
  doc.rect(0, 62, W, 22, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const meta = [
    `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    `Duration: ${project.totalEstimatedDays || "N/A"} days`,
    `Budget: ${project.totalEstimatedCost || "N/A"}`,
    `Feasibility: ${project.feasibilityScore || "N/A"}/100`,
    `Tasks: ${totalTasks}`,
  ];
  meta.forEach((m, i) => doc.text(m, 14 + i * 40, 75));

  // ── Section: Executive Summary ───────────────────────────────────────────────
  y = 92;
  doc.setFillColor(...AMBER);
  doc.rect(14, y, 3, 6, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("EXECUTIVE SUMMARY", 20, y + 5);

  y += 12;
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(project.summary || "No summary available.", W - 28);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 5 + 6;

  // ── Section: Feasibility Breakdown ──────────────────────────────────────────
  doc.setFillColor(...AMBER);
  doc.rect(14, y, 3, 6, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FEASIBILITY ANALYSIS", 20, y + 5);
  y += 12;

  const feasData = Object.entries(project.feasibilityBreakdown || {}).map(([k, v]) => [
    k.charAt(0).toUpperCase() + k.slice(1),
    `${v}/100`,
    v >= 75 ? "✓ Good" : v >= 50 ? "⚠ Fair" : "✗ Poor",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Dimension", "Score", "Rating"]],
    body: feasData,
    theme: "plain",
    headStyles: { fillColor: DARK2, textColor: AMBER, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fillColor: [20, 21, 22], textColor: MUTED, fontSize: 9 },
    alternateRowStyles: { fillColor: DARK2 },
    margin: { left: 14, right: 14 },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 } },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Section: Project Progress ────────────────────────────────────────────────
  doc.setFillColor(...AMBER);
  doc.rect(14, y, 3, 6, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PROJECT PROGRESS", 20, y + 5);
  y += 12;

  // Progress bar
  doc.setFillColor(30, 31, 32);
  doc.roundedRect(14, y, W - 28, 6, 2, 2, "F");
  const barW = Math.round((pct / 100) * (W - 28));
  if (barW > 0) {
    doc.setFillColor(...AMBER);
    doc.roundedRect(14, y, barW, 6, 2, 2, "F");
  }
  doc.setTextColor(...LIGHT);
  doc.setFontSize(9);
  doc.text(`${pct}% Complete — ${completedTasks}/${totalTasks} tasks`, 14, y + 12);
  y += 18;

  // ── Section: Phase Summary Table ─────────────────────────────────────────────
  doc.setFillColor(...AMBER);
  doc.rect(14, y, 3, 6, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PHASE BREAKDOWN", 20, y + 5);
  y += 8;

  const phaseRows = (project.phases || []).map((ph) => {
    const done = ph.tasks.filter((t) => t.status === "completed").length;
    const blk = ph.tasks.filter((t) => t.status === "blocked").length;
    const cost = ph.tasks.reduce((s, t) => s + parseCost(t.estimatedCost), 0);
    return [ph.phaseId, ph.phaseName, `${ph.durationDays}d`, `₹${cost.toFixed(1)} Cr`, `${done}/${ph.tasks.length}`, blk > 0 ? `${blk} blocked` : "OK"];
  });

  autoTable(doc, {
    startY: y,
    head: [["ID", "Phase", "Duration", "Est. Cost", "Tasks", "Status"]],
    body: phaseRows,
    theme: "plain",
    headStyles: { fillColor: DARK2, textColor: AMBER, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fillColor: [20, 21, 22], textColor: MUTED, fontSize: 8 },
    alternateRowStyles: { fillColor: DARK2 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── New page: Task List ───────────────────────────────────────────────────────
  doc.addPage();
  y = 20;

  doc.setFillColor(...AMBER);
  doc.rect(14, y, 3, 6, "F");
  doc.setTextColor(...LIGHT);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("COMPLETE TASK LIST", 20, y + 5);
  y += 8;

  const taskRows = allTasks.map((t) => [
    t.taskId,
    t.taskName?.substring(0, 30) || "",
    t.category || "",
    t.priority || "",
    `${t.durationDays || 0}d`,
    t.estimatedCost || "",
    t.status || "pending",
    `${t.completionPercent || 0}%`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["ID", "Task", "Category", "Priority", "Dur.", "Cost", "Status", "%"]],
    body: taskRows,
    theme: "plain",
    headStyles: { fillColor: DARK2, textColor: AMBER, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fillColor: [20, 21, 22], textColor: MUTED, fontSize: 7 },
    alternateRowStyles: { fillColor: DARK2 },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        const status = data.cell.raw;
        if (status === "completed") data.cell.styles.textColor = GREEN;
        else if (status === "blocked") data.cell.styles.textColor = RED;
        else if (status === "in-progress") data.cell.styles.textColor = AMBER;
      }
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Risk Register ─────────────────────────────────────────────────────────────
  if (project.risks?.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFillColor(...AMBER);
    doc.rect(14, y, 3, 6, "F");
    doc.setTextColor(...LIGHT);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RISK REGISTER", 20, y + 5);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["ID", "Risk", "Severity", "Mitigation"]],
      body: project.risks.map((r) => [r.riskId, r.title, r.severity, r.mitigation?.substring(0, 60) || ""]),
      theme: "plain",
      headStyles: { fillColor: DARK2, textColor: AMBER, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fillColor: [20, 21, 22], textColor: MUTED, fontSize: 8 },
      alternateRowStyles: { fillColor: DARK2 },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const sev = data.cell.raw;
          if (sev === "High") data.cell.styles.textColor = RED;
          else if (sev === "Medium") data.cell.styles.textColor = AMBER;
          else data.cell.styles.textColor = GREEN;
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Recommendations ───────────────────────────────────────────────────────────
  if (project.recommendations?.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFillColor(...AMBER);
    doc.rect(14, y, 3, 6, "F");
    doc.setTextColor(...LIGHT);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("AI RECOMMENDATIONS", 20, y + 5);
    y += 12;

    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    project.recommendations.forEach((r, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${r}`, W - 28);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 3;
    });
  }

  // ── Footer on all pages ───────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...DARK2);
    doc.rect(0, 285, W, 12, "F");
    doc.setFillColor(...AMBER);
    doc.rect(0, 285, W, 0.5, "F");
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("InfraPlan AI — Smart India Hackathon 2024", 14, 291);
    doc.text(`Page ${i} of ${totalPages}`, W - 14, 291, { align: "right" });
    doc.text(project.projectName || "", W / 2, 291, { align: "center" });
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  const filename = `InfraPlan_${(project.projectName || "Report").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}
