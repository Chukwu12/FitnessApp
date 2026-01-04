const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // server-only env var
});

router.post("/", async (req, res) => {
  try {
    const { exerciseName } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ error: "Exercise name is required" });
    }

    const prompt = `You are a fitness coach. Provide clear beginner-friendly instructions for: ${exerciseName}.
Use markdown with this format:

## Equipment required

## Instructions

### Tips

### Variations

### Safety
Keep it concise.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return res.json({ message: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error fetching AI guidance" });
  }
});

module.exports = router;
