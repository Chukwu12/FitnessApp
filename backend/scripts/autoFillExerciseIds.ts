require("../load-env.cjs");
const sanity = require("./sanityClient.cjs");
const axios = require("axios");

const RAPID_API_KEY = process.env.RAPID_API_KEY;

if (!RAPID_API_KEY) {
  throw new Error("Missing RAPID_API_KEY");
}

interface RapidExercise {
  id: string;
  name: string;
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fetchAllRapidExercises(): Promise<RapidExercise[]> {
  try {
    const response = await axios.get(
      "https://exercisedb.p.rapidapi.com/exercises",
      {
        headers: {
          "X-RapidAPI-Key": RAPID_API_KEY,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Error fetching exercises from RapidAPI:", err);
    return [];
  }
}

async function autoFillExerciseIds() {
  console.log("🚀 Starting auto-fill of missing exerciseId...");

  const missingExercises: { _id: string; name: string }[] = await sanity.fetch(
    `*[_type == "exercise" && (!defined(exerciseId) || exerciseId == null)]{
      _id,
      name
    }`
  );

  if (missingExercises.length === 0) {
    console.log("✅ No exercises missing exerciseId!");
    return;
  }

  const rapidExercises = await fetchAllRapidExercises();

  let updatedCount = 0;
  let skippedCount = 0;

  for (const ex of missingExercises) {
    const normalizedExName = normalizeName(ex.name);

    const match = rapidExercises.find(
      (r) => normalizeName(r.name) === normalizedExName
    );

    if (!match) {
      console.warn(`⚠️ No RapidAPI match found for "${ex.name}"`);
      skippedCount++;
      continue;
    }

    try {
      await sanity
        .patch(ex._id)
        .set({ exerciseId: match.id })
        .commit({ autoGenerateArrayKeys: true });

      console.log(`✅ Updated exerciseId for "${ex.name}" -> ${match.id}`);
      updatedCount++;
    } catch (err) {
      console.error(`❌ Error updating "${ex.name}":`, err);
    }
  }

  console.log("🎉 Auto-fill complete!");
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
}

autoFillExerciseIds();
