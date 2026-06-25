const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      goal = "Build muscle",
      fitness_level = "Beginner",
      preferences = ["Weight training"],
      health_conditions = ["None"],
      schedule = { days_per_week: 3, session_duration: 45 },
      plan_duration_weeks = 4,
      lang = "en",
    } = req.body;

    // 🔒 SAFETY CHECK (prevents your previous crash)
    if (!process.env.WORKOUT_API_URL) {
      console.warn("⚠️ Missing WORKOUT_API_URL — using fallback");

      return res.json({
        weeks: [
          {
            week: 1,
            days: [
              {
                day: "Day 1",
                exercises: [
                  { name: "Push Ups", sets: 3, reps: "10-12" },
                  { name: "Squats", sets: 3, reps: "12-15" },
                ],
              },
            ],
          },
        ],
      });
    }

    // ✅ Add query param here
    const url = `${process.env.WORKOUT_API_URL}?noqueue=1`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        // 🔥 RapidAPI headers (FIXED)
        "x-rapidapi-key": process.env.WORKOUT_API_KEY,
        "x-rapidapi-host":
          "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com",
      },
      body: JSON.stringify({
        goal,
        fitness_level,
        preferences,
        health_conditions,
        schedule,
        plan_duration_weeks,
        lang,
      }),
    });

    // 🔥 safer parsing (prevents JSON crash)
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON Parse Error:", text);
      return res.status(500).json({
        error: "Invalid response from workout API",
        raw: text,
      });
    }

    if (!response.ok) {
      console.error("❌ API ERROR:", data);
      return res.status(500).json({
        error: "Failed to generate plan",
        details: data,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    res.status(500).json({ error: "Server error generating plan" });
  }
});

module.exports = router;