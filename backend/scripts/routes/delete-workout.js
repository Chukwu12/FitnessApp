const express = require("express");
const router = express.Router();
const adminClient = require("../sanityClient.cjs");

router.post("/", async (req, res) => {
  try {
    const { workoutId } = req.body;

    if (!workoutId) {
      return res.status(400).json({ error: "workoutId is required" });
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
