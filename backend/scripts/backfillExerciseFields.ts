// backend/scripts/backfillExerciseFields.ts
require("dotenv").config();

const axios = require("axios");
const { createClient } = require("@sanity/client");

// ---- env ----
const SANITY_PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET || "production";
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
const RAPID_API_KEY = process.env.RAPID_API_KEY;

if (!SANITY_PROJECT_ID)
  throw new Error("Missing EXPO_PUBLIC_SANITY_PROJECT_ID");
if (!SANITY_API_TOKEN) throw new Error("Missing SANITY_API_TOKEN");
if (!BACKEND_BASE_URL) throw new Error("Missing EXPO_PUBLIC_BACKEND_URL");
if (!RAPID_API_KEY) throw new Error("Missing RAPID_API_KEY");

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function getExerciseGifUrl(exerciseId: string) {
  return `${BACKEND_BASE_URL}/api/gifs/exercise/${exerciseId}`;
}

function normalizeDifficulty(difficulty?: string) {
  const d = (difficulty || "").toLowerCase();
  if (d === "beginner" || d === "intermediate" || d === "advanced") return d;
  return "beginner";
}

function normalizeCategory(category?: string) {
  return category ? category.toLowerCase() : undefined;
}

function needsGifRepair(ex: any) {
  if (!ex.exerciseId) return false;
  if (!ex.gifUrl) return true;
  if (String(ex.gifUrl).includes("exerciseId=null")) return true;
  return false;
}

function isMissingArray(arr?: unknown[]) {
  return !arr || arr.length === 0;
}

function isMissingText(s?: string) {
  return !s || !String(s).trim();
}

// RapidAPI: /exercises/exercise/{id}
async function fetchRapidExerciseById(id: string) {
  try {
    const res = await axios.get(
      `https://exercisedb.p.rapidapi.com/exercises/exercise/${id}`,
      {
        headers: {
          "X-RapidAPI-Key": RAPID_API_KEY,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error(`❌ RapidAPI fetch failed for id=${id}`);
    return null;
  }
}

async function backfill() {
  console.log("🚀 Starting backfill/repair...");

  const exercises = await sanity.fetch(`
    *[_type == "exercise"]{
      _id,
      exerciseId,
      gifUrl,
      difficulty,
      category,
      description,
      instructions,
      secondaryMuscles
    }
  `);

  let updated = 0;
  let skipped = 0;
  let missingId = 0;

  for (const ex of exercises) {
    if (!ex.exerciseId) {
      missingId++;
      continue;
    }

    const needsRapid =
      isMissingArray(ex.secondaryMuscles) ||
      isMissingText(ex.category) ||
      isMissingText(ex.description) ||
      isMissingArray(ex.instructions) ||
      (ex.difficulty ? ex.difficulty !== ex.difficulty.toLowerCase() : true);

    const patch: Record<string, any> = {};

    // repair gifUrl
    if (needsGifRepair(ex)) {
      patch.gifUrl = getExerciseGifUrl(ex.exerciseId);
    }

    if (needsRapid) {
      const rapid = await fetchRapidExerciseById(ex.exerciseId);

      if (rapid) {
        if (isMissingArray(ex.secondaryMuscles)) {
          patch.secondaryMuscles = rapid.secondaryMuscles ?? [];
        }
        if (isMissingText(ex.category)) {
          patch.category = normalizeCategory(rapid.category);
        }
        if (isMissingText(ex.description)) {
          patch.description = rapid.description ?? "";
        }
        if (isMissingArray(ex.instructions)) {
          patch.instructions = rapid.instructions ?? [];
        }

        // always normalize difficulty to lowercase enum
        patch.difficulty = normalizeDifficulty(
          rapid.difficulty ?? ex.difficulty
        );
      }
    }

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    try {
      await sanity.patch(ex._id).set(patch).commit();
      updated++;
      console.log(`✅ Patched exerciseId=${ex.exerciseId}`, patch);
    } catch (err) {
      console.error(`❌ Failed patching exerciseId=${ex.exerciseId}`, err);
    }
  }

  console.log("🎉 Backfill complete!");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Missing exerciseId: ${missingId}`);
}

backfill();
