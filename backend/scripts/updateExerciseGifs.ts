// backend/scripts/updateExerciseGifs.ts
require("../load-env.cjs");

const { createClient } = require("@sanity/client");

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET || "production";
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL?.replace(/\/$/, "");

if (!SANITY_PROJECT_ID)
  throw new Error("Missing SANITY_PROJECT_ID");
if (!SANITY_API_TOKEN) throw new Error("Missing SANITY_API_TOKEN");
if (!BACKEND_BASE_URL) throw new Error("Missing BACKEND_BASE_URL");

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

function needsUpdate(ex: { exerciseId?: any; gifUrl?: string }) {
  if (!ex.exerciseId) return false;

  const id = String(ex.exerciseId);
  const expected = getExerciseGifUrl(id);

  // update if missing, null, or wrong value
  if (!ex.gifUrl) return true;
  if (ex.gifUrl.includes("exerciseId=null")) return true;
  if (ex.gifUrl !== expected) return true;

  return false;
}

async function updateExerciseGifs() {
  console.log("🚀 Starting GIF repair/update...");

  const exercises = await sanity.fetch(
    `*[_type == "exercise"]{_id, exerciseId, gifUrl}`
  );

  let updatedCount = 0;
  let skippedCount = 0;
  let missingIdCount = 0;

  for (const ex of exercises) {
    if (!ex.exerciseId) {
      missingIdCount++;
      skippedCount++;
      console.warn(`⚠️ Missing exerciseId (RapidAPI) for _id=${ex._id}`);
      continue;
    }

    if (!needsUpdate(ex)) {
      skippedCount++;
      continue;
    }

    const id = String(ex.exerciseId);
    const gifUrl = getExerciseGifUrl(id);

    try {
      await sanity.patch(ex._id).set({ gifUrl }).commit();
      console.log(`✅ Updated gifUrl for exerciseId=${id}`);
      updatedCount++;
    } catch (err) {
      console.error(`❌ Error updating _id=${ex._id} exerciseId=${id}:`, err);
    }
  }

  console.log("🎉 GIF update complete!");
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Missing exerciseId: ${missingIdCount}`);
}

updateExerciseGifs().catch((err: any) => {
  console.error("❌ Script failed:", err);
});
