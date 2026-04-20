const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const router = express.Router();




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

module.exports = router;
