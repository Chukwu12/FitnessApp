// backend/server.js
require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");

const gifsRouter = require("./scripts/routes/gifs");
const aiRouter = require("./scripts/routes/ai");
const deleteWorkoutRouter = require("./scripts/routes/delete-workout");

const app = express();

// ✅ DEFINE PORT FIRST
const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: [
    "https://scaling-goggles-9qgjg64j55w3xx5v-8081.app.github.dev",
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:19000",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// ✅ Always allow preflight to succeed
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/debug/env", (_req, res) => {
  res.json({ hasRapidKey: !!process.env.RAPID_API_KEY });
});

// routes
app.use("/api/gifs", gifsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/delete-workout", deleteWorkoutRouter);

// ✅ bind to all interfaces (required for CodeSandbox)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
