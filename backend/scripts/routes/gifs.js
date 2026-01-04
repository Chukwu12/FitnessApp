// backend/scripts/routes/gifs.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/exercise/:exerciseId", async (req, res) => {
  try {
    const { exerciseId } = req.params;

    const rapidKey = process.env.RAPID_API_KEY;

    if (!rapidKey) {
      return res.status(500).json({ error: "Missing RapidAPI key" });
    }

    const url = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=180`;

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });

    // ✅ allow embedding as an image on web
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "image/gif"
    );

    return res.send(Buffer.from(response.data));
  } catch (e) {
    return res.status(404).json({ error: "IMAGE NOT FOUND" });
  }
});

module.exports = router;
