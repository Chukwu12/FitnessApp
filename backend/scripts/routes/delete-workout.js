const express = require("express");
const { ipKeyGenerator, rateLimit } = require("express-rate-limit");
const router = express.Router();
const adminClient = require("../sanityClient.cjs");
const { requireAuth } = require("../../auth");

const workoutWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  message: {
    error: "Too many workout write requests. Please try again in a minute.",
  },
});

router.post("/", workoutWriteLimiter, requireAuth, async (req, res) => {
  try {
    const { workoutId } = req.body;
    const userId = req.auth?.userId;

    if (!workoutId) {
      return res.status(400).json({ error: "workoutId is required" });
    }

    const workout = await adminClient.fetch(
      `*[_type == "workout" && _id == $workoutId][0]{ _id, userId }`,
      { workoutId }
    );

    if (!workout?._id) {
      return res.status(404).json({ error: "Workout not found" });
    }

    if (workout.userId !== userId) {
      return res.status(403).json({ error: "You can only delete your own workout" });
    }

    await adminClient.delete(workoutId);

    return res.json({
      success: true,
      message: "Workout deleted successfully",
      workoutId,
    });
  } catch (error) {
    console.error("Error deleting workout", error);
    return res.status(500).json({ error: "Failed to delete workout" });
  }
});

module.exports = router;
