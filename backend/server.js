// backend/server.js
require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");

const gifsRouter = require("./scripts/routes/gifs");
const aiRouter = require("./scripts/routes/ai");
const deleteWorkoutRouter = require("./scripts/routes/delete-workout");
const workoutsRouter = require("./scripts/routes/workouts");
const sanityDebugRouter = require("./scripts/routes/sanity-debug");
const workoutPlanRouter = require("./scripts/routes/workout-plan");

const app = express();

// ✅ DEFINE PORT FIRST
const PORT = process.env.PORT || 4000;

const allowedOrigins = new Set([
  "https://scaling-goggles-9qgjg64j55w3xx5v-8081.app.github.dev",
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:19000",
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    return (
      (protocol === "http:" &&
        (hostname === "localhost" || hostname === "127.0.0.1")) ||
      (protocol === "https:" && hostname.endsWith(".app.github.dev"))
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin not allowed: ${origin}`));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

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
app.use("/api/workouts", workoutsRouter);
app.use("/api/workout-plan", workoutPlanRouter);
app.use("/api/debug/sanity", sanityDebugRouter);
// ✅ bind to all interfaces (required for CodeSandbox)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
