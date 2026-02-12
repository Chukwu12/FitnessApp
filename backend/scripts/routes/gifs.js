// backend/scripts/routes/gifs.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * In-memory cache:
 * exerciseId -> { data: Buffer, contentType: string, expiresAt: number }
 *
 * NOTE: This resets when your server restarts.
 */
const cache = new Map();
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Helps avoid cache growing forever in dev
function pruneCache() {
  const now = Date.now();
  for (const [key, val] of cache.entries()) {
    if (!val || val.expiresAt <= now) cache.delete(key);
  }
}
setInterval(pruneCache, 1000 * 60 * 10).unref(); // every 10 min

// ✅ handle preflight (helps web)
router.options("/exercise/:exerciseId", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.sendStatus(204);
});

router.get("/exercise/:exerciseId", async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const rapidKey = process.env.RAPID_API_KEY;

    if (!rapidKey) {
      return res.status(500).json({ error: "Missing RapidAPI key" });
    }

    // 1) Cache hit
    const cached = cache.get(exerciseId);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Type", cached.contentType || "image/gif");
      res.setHeader("Cache-Control", "public, max-age=604800, immutable"); // 7 days
      return res.status(200).send(cached.data);
    }

    const url = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=180`;

    const upstream = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
      validateStatus: () => true, // don't throw for non-200
    });

    // 2) If invalid id / no image -> return 204 so frontend can fallback
    if (
      upstream.status !== 200 ||
      !upstream.data ||
      upstream.data.byteLength === 0
    ) {
      console.warn("[GIF] no image / invalid:", exerciseId, "status:", upstream.status);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-store");
      return res.sendStatus(204);
    }

    const contentType = upstream.headers?.["content-type"] || "image/gif";
    const data = Buffer.from(upstream.data);

    // 3) Cache success responses
    cache.set(exerciseId, {
      data,
      contentType,
      expiresAt: Date.now() + TTL_MS,
    });

    // 4) Response headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=604800, immutable"); // 7 days

    return res.status(200).send(data);
  } catch (e) {
    const status = e?.response?.status || 500;
    const data = e?.response?.data;

    console.error("GIF proxy error status:", status);
    console.error("GIF proxy error data:", data);
    console.error("GIF proxy error message:", e?.message);

    return res.status(status).json({
      error: "GIF PROXY FAILED",
      status,
      data: typeof data === "string" ? data.slice(0, 300) : data,
    });
  }
});


module.exports = router;
