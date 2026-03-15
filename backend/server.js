import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import projectRoutes from "./routes/projects.js";
import modelRoutes from "./routes/model.js";
import scraperRoutes from "./routes/scraper.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use("/api/", limiter);

app.use("/api/projects", projectRoutes);
app.use("/api/model", modelRoutes);
app.use("/api/scraper", scraperRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: process.env.HF_MODEL_URL ? "huggingface" : "fallback",
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`🚀 InfraPlan backend → http://localhost:${PORT}`);
  console.log(`🤖 Model: ${process.env.HF_MODEL_URL || "Using rule-based fallback (set HF_MODEL_URL after fine-tuning)"}`);
});
