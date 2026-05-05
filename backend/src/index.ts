import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat.js";
import analyzeRouter from "./routes/analyze.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:8080", "http://127.0.0.1:8080"];

const localhostOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }

    if (allowedOrigins.includes(origin) || localhostOriginRegex.test(origin)) {
      cb(null, true);
      return;
    }

    cb(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());

app.use("/api/chat", chatRouter);
app.use("/api/analyze", analyzeRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
