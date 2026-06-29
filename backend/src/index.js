import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { assetsRouter } from "./routes/assets.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/assets", assetsRouter);

// Fallback 404 for anything else under /api
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Twindeo backend listening on http://localhost:${PORT}`);
});
