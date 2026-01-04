// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const gifsRouter = require("./scripts/routes/gifs");
const aiRouter = require("./scripts/routes/ai");

const app = express();

// ✅ DEFINE PORT FIRST
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// routes
app.use("/api/gifs", gifsRouter);
app.use("/api/ai", aiRouter);

// ✅ bind to all interfaces (required for CodeSandbox)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
