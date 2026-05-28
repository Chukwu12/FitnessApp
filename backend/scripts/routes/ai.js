const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const router = express.Router();

const RAPID_WORKOUT_HOST =
  "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com";

function normalizeNutritionAdvice(payload) {
  const source = payload?.result || payload || {};

  const calories =
    source.calories_per_day ||
    source.daily_calories ||
    source.calories ||
    source.total_calories ||
    source.calorie_target ||
    "Not provided";

  const macros = source.macronutrients || source.macros || {};

  const mealSuggestions = Array.isArray(source.meal_suggestions)
    ? source.meal_suggestions
      .map((mealBlock) => {
        const meal = mealBlock?.meal;
        const first = Array.isArray(mealBlock?.suggestions)
          ? mealBlock.suggestions[0]
          : null;

        if (!meal || !first?.name) return null;

        return {
          meal,
          name: String(first.name),
          calories: first.calories != null ? String(first.calories) : "",
        };
      })
      .filter(Boolean)
    : [];

  const tips = [
    ...(Array.isArray(source.nutrition_tips) ? source.nutrition_tips : []),
    ...(Array.isArray(source.tips) ? source.tips : []),
    ...(Array.isArray(source.advice) ? source.advice : []),
  ]
    .filter((tip) => typeof tip === "string" && tip.trim().length > 0)
    .slice(0, 5);

  return {
    goal: source.goal || "General nutrition",
    description: String(source.description || ""),
    dailyCalories: String(calories),
    macros: {
      protein: String(
        macros.protein || macros.proteins || source.protein || "Not provided"
      ),
      carbs: String(
        macros.carbs || macros.carbohydrates || source.carbs || "Not provided"
      ),
      fats: String(macros.fats || source.fats || "Not provided"),
    },
    tips,
    mealSuggestions,
    source: payload,
  };
}




router.post("/", async (req, res) => {
  try {
    const { exerciseName } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ error: "Exercise name is required" });
    }

    const prompt = `
You are a fitness coach. Provide clear beginner-friendly instructions for: ${exerciseName}.

Use markdown with this format:

## Equipment required
## Instructions
### Tips
### Variations
### Safety

Keep it concise.
`;

console.log("✅ Gemini responded");

 const result = await model.generateContent(prompt);

if (!result || !result.response) {
  console.error("❌ Gemini returned invalid response:", result);
  return res.status(500).json({
    error: "AI failed to generate response",
  });
}

const text = result.response.text();

    return res.json({ message: text });
  } catch (err) {
  console.error("🔥 FULL AI ERROR:", err);

  return res.status(500).json({
    error: "Error generating workout",
    message: err.message,
  });
}
});

// 🏋️ AI WORKOUT GENERATOR
router.post("/workout", async (req, res) => {
  try {
    const { fitnessLevel = "beginner", goal = "general fitness" } = req.body || {};

    const prompt = `
You are a professional fitness coach.

Create a ${fitnessLevel} level workout for someone whose goal is: ${goal}.

Return ONLY JSON in this format:

{
  "title": "Workout name",
  "duration": "e.g. 45 min",
  "exercises": [
    { "name": "Exercise name", "sets": 3, "reps": "10-12" }
  ]
}

Do not include markdown. Do not include explanations.
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // 🔥 CLEAN RESPONSE (VERY IMPORTANT)
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let workout;

    try {
      workout = JSON.parse(text);
    } catch (err) {
      console.error("Parse error:", text);
      return res.status(500).json({
        error: "Failed to parse AI workout",
        raw: text,
      });
    }

    return res.json(workout);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error generating workout" });
  }
});

// 🥗 RAPIDAPI NUTRITION ADVICE
router.post("/nutrition", async (req, res) => {
  try {
    const {
      goal = "build muscle",
      fitness_level = "beginner",
      dietary_preferences = ["high protein"],
      health_conditions = ["none"],
      schedule = { days_per_week: 4, session_duration: 60 },
      lang = "en",
    } = req.body || {};

    if (!process.env.WORKOUT_API_KEY) {
      return res.status(500).json({
        error: "WORKOUT_API_KEY is missing",
      });
    }

    const nutritionUrl =
      process.env.WORKOUT_NUTRITION_API_URL ||
      `https://${RAPID_WORKOUT_HOST}/nutritionAdvice`;

    const response = await fetch(`${nutritionUrl}?noqueue=1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-key": process.env.WORKOUT_API_KEY,
        "x-rapidapi-host": RAPID_WORKOUT_HOST,
      },
      body: JSON.stringify({
        goal,
        fitness_level,
        dietary_preferences,
        health_conditions,
        schedule,
        lang,
      }),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Nutrition parse error:", text);
      return res.status(500).json({
        error: "Invalid response from nutrition API",
        raw: text,
      });
    }

    if (!response.ok) {
      console.error("Nutrition API error:", data);
      return res.status(500).json({
        error: "Failed to generate nutrition advice",
        details: data,
      });
    }

    return res.json(normalizeNutritionAdvice(data));
  } catch (err) {
    console.error("Nutrition advice route error:", err);
    return res.status(500).json({
      error: "Error generating nutrition advice",
      message: err.message,
    });
  }
});

module.exports = router;
