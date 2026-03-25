const express = require("express");
const { randomUUID } = require("crypto");
const adminClient = require("../sanityClient.cjs");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, date, duration, exercises } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (!date) {
      return res.status(400).json({ error: "Missing date" });
    }

    if (typeof duration !== "number") {
      return res.status(400).json({ error: "Missing or invalid duration" });
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: "Exercises are required" });
    }

    for (const ex of exercises) {
      if (!ex?.exercise?._ref) {
        return res
          .status(400)
          .json({ error: "Each exercise must include a valid reference _ref" });
      }

      if (!Array.isArray(ex.sets) || ex.sets.length === 0) {
        return res
          .status(400)
          .json({ error: "Each exercise must include at least one set" });
      }
    }

    const workoutDoc = {
      _type: "workout",
      userId,
      date,
      duration,
      exercises: exercises.map((ex) => ({
        _key: randomUUID(),
        exercise: {
          _type: "reference",
          _ref: ex.exercise._ref,
        },
        sets: ex.sets.map((set) => ({
          _key: randomUUID(),
          reps: Number(set.reps) || 0,
          weight: Number(set.weight) || 0,
          weightUnit: set.weightUnit === "kg" ? "kg" : "lbs",
        })),
      })),
    };

    const createdWorkout = await adminClient.create(workoutDoc);

    return res.status(201).json({
      ok: true,
      workoutId: createdWorkout._id,
    });
  } catch (error) {
    console.error("Error creating workout:", error);

    const message = error?.message || "Unknown error";
    const isUnauthorized = /unauthorized|session not found|forbidden/i.test(
      message
    );

    return res.status(500).json({
      error: "Failed to create workout",
      details: isUnauthorized
        ? "Sanity write token is invalid, expired, or missing write permission"
        : message,
    });
  }
});

module.exports = router;
