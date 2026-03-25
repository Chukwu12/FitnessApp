const express = require("express");
const { randomUUID } = require("crypto");
const adminClient = require("../sanityClient.cjs");

const router = express.Router();

// Quick write-auth check: create and delete a temporary doc.
router.get("/write-check", async (_req, res) => {
  const tempId = `debugWrite_${randomUUID()}`;

  try {
    const tokenPresent = Boolean(
      process.env.SANITY_API_TOKEN ||
        process.env.SANITY_WRITE_TOKEN ||
        process.env.SANITY_TOKEN
    );

    const projectId = process.env.SANITY_PROJECT_ID;
    const dataset = process.env.SANITY_DATASET || "production";

    const created = await adminClient.create({
      _id: tempId,
      _type: "debugWriteProbe",
      createdAt: new Date().toISOString(),
    });

    await adminClient.delete(created._id);

    return res.json({
      ok: true,
      message: "Sanity write authentication is valid",
      projectId,
      dataset,
      tokenPresent,
    });
  } catch (error) {
    const message = error?.message || "Unknown error";
    const isUnauthorized = /unauthorized|session not found|forbidden/i.test(
      message
    );

    // Cleanup attempt in case create succeeded but delete failed.
    try {
      await adminClient.delete(tempId);
    } catch (_cleanupError) {
      // No-op cleanup fallback.
    }

    return res.status(500).json({
      ok: false,
      error: isUnauthorized
        ? "Sanity token unauthorized for writes"
        : "Sanity write check failed",
      details: message,
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET || "production",
      tokenPresent: Boolean(
        process.env.SANITY_API_TOKEN ||
          process.env.SANITY_WRITE_TOKEN ||
          process.env.SANITY_TOKEN
      ),
    });
  }
});

module.exports = router;
