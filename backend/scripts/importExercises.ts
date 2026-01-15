// scripts/importExercises.ts
require("dotenv").config();

const axios = require("axios");
const { createClient } = require("@sanity/client");

// ✅ Node scripts should read from process.env
const SANITY_PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET || "production";
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;

// ✅ RapidAPI key
const RAPID_API_KEY =
  process.env.EXPO_PUBLIC_RAPID_API_KEY || process.env.RAPID_API_KEY;

if (!SANITY_PROJECT_ID) {
  throw new Error("Missing EXPO_PUBLIC_SANITY_PROJECT_ID in .env");
}
if (!SANITY_DATASET) {
  throw new Error("Missing EXPO_PUBLIC_SANITY_DATASET in .env");
}
if (!SANITY_API_TOKEN) {
  throw new Error("Missing SANITY_API_TOKEN in .env (required for writes)");
}
if (!RAPID_API_KEY) {
  throw new Error(
    "Missing EXPO_PUBLIC_RAPID_API_KEY (or RAPID_API_KEY) in .env"
  );
}

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// RapidAPI shape (based on your sample)
interface RapidExercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  equipment: string;
  difficulty?: string; // beginner | intermediate | advanced
  category?: string; // strength, etc
  description?: string;
  tags?: string[];
}

async function fetchExercisesFromRapidAPI(
  limit = 10
): Promise<RapidExercise[]> {
  try {
    const response = await axios.get(
      "https://exercisedb.p.rapidapi.com/exercises",
      {
        headers: {
          "X-RapidAPI-Key": RAPID_API_KEY,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
        params: { limit },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching exercises from RapidAPI:", error);
    return [];
  }
}

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_BACKEND_URL ||  in .env");
}

function getExerciseGifUrl(exerciseId: string) {
  if (!exerciseId) return null;
  // ✅ Proxy URL (web-safe)
  return `${BACKEND_BASE_URL}/api/gifs/exercise/${exerciseId}`;
}

// ✅ difficulty stored lowercase to match schema list
function normalizeDifficulty(difficulty?: string) {
  const d = (difficulty || "").toLowerCase();
  if (d === "beginner" || d === "intermediate" || d === "advanced") return d;
  return "beginner";
}

function normalizeCategory(category?: string) {
  return category ? category.toLowerCase() : undefined;
}

async function importExercises() {
  console.log("🚀 Starting exercise import...");

  const exercises = await fetchExercisesFromRapidAPI(20);
  if (!exercises.length) {
    console.log("No exercises fetched from RapidAPI.");
    return;
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const ex of exercises) {
    // ✅ Skip if already exists
    const existing = await sanity.fetch(
      `*[_type == "exercise" && exerciseId == $id][0]{_id}`,
      { id: ex.id }
    );

    if (existing?._id) {
      skippedCount++;
      continue;
    }

    const gifUrl = getExerciseGifUrl(ex.id);

    const doc = {
      _type: "exercise",
      exerciseId: ex.id,
      name: ex.name,
      bodyPart: ex.bodyPart,
      target: ex.target,
      secondaryMuscles: ex.secondaryMuscles ?? [],
      equipment: ex.equipment,
      category: normalizeCategory(ex.category),
      difficulty: normalizeDifficulty(ex.difficulty),
      instructions: ex.instructions ?? [],
      description: ex.description ?? "",
      tags: ex.tags ?? [],
      gifUrl,
      isActive: true,
    };

    try {
      await sanity.create(doc);
      createdCount++;
      console.log(`✅ Created: ${ex.id} ${ex.name}`);
    } catch (err) {
      console.error(`❌ Error creating exercise ${ex.name}:`, err);
    }
  }

  console.log("✅ Import complete");
  console.log(`Created: ${createdCount}`);
  console.log(`Skipped: ${skippedCount}`);
}

importExercises();
