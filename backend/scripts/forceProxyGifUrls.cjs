// backend/scripts/forceProxyGifUrls.ts
require("dotenv").config();

const { createClient } = require("@sanity/client");

const SANITY_PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET || "production";
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!SANITY_PROJECT_ID)
  throw new Error("Missing EXPO_PUBLIC_SANITY_PROJECT_ID");
if (!SANITY_API_TOKEN) throw new Error("Missing SANITY_API_TOKEN");
if (!BACKEND_BASE_URL) throw new Error("Missing EXPO_PUBLIC_BACKEND_URL");

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function proxyGifUrl(exerciseId) {
  return `${BACKEND_BASE_URL}/api/gifs/exercise/${exerciseId}`;
}

async function run() {
  console.log("🚀 Forcing gifUrl to backend proxy for all exercises...");

  const exercises = await sanity.fetch(
    `*[_type == "exercise" && defined(exerciseId)]{_id, exerciseId, gifUrl}`
  );

  let updated = 0;

  for (const ex of exercises) {
    const nextUrl = proxyGifUrl(ex.exerciseId);

    // skip if already proxy
    if (ex.gifUrl === nextUrl) continue;

    await sanity.patch(ex._id).set({ gifUrl: nextUrl }).commit();
    updated++;
    console.log(`✅ ${ex.exerciseId} -> ${nextUrl}`);
  }

  console.log("🎉 Done");
  console.log("Updated:", updated);
}

run();
