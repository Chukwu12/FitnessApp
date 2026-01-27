// backend/scripts/routes/gifs.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

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

    if (!rapidKey)
      return res.status(500).json({ error: "Missing RapidAPI key" });

    const url = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=180`;

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
      validateStatus: () => true,
    });

    // If RapidAPI says 429/403/etc, pass it through cleanly
    if (response.status !== 200) {
      return res.status(response.status).json({
        error: "Upstream error",
        upstreamStatus: response.status,
      });
    }

    // ✅ allow embedding as an image on web
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // ✅ avoid sniffing issues
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Cache to reduce calls (helps a LOT)
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24h

    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "image/gif"
    );

    return res.send(Buffer.from(response.data));
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
