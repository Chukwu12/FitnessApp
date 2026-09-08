require("../load-env.cjs");

const axios = require("axios");
const sanity = require("./sanityClient.cjs");

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL?.replace(/\/$/, "");
const DRY_RUN = process.env.SYNC_EXERCISES_DRY_RUN === "1";
const LIMIT = Number(process.env.SYNC_EXERCISES_LIMIT || 0);

if (!RAPID_API_KEY) {
  throw new Error("Missing RAPID_API_KEY");
}

if (!BACKEND_BASE_URL) {
  throw new Error("Missing BACKEND_BASE_URL");
}

const VALID_CATEGORIES = new Set([
  "strength",
  "cardio",
  "stretching",
  "plyometrics",
  "powerlifting",
  "strongman",
  "olympic weightlifting",
]);

type SanityExercise = {
  _id: string;
  exerciseId?: string;
  name?: string;
  bodyPart?: string;
  target?: string;
  secondaryMuscles?: string[];
  equipment?: string;
  category?: string;
  instructions?: string[];
  gifUrl?: string;
  difficulty?: string;
  description?: string;
};

type RapidExercise = {
  id: string;
  name?: string;
  bodyPart?: string;
  target?: string;
  secondaryMuscles?: string[];
  equipment?: string;
  category?: string;
  instructions?: string[];
  description?: string;
  difficulty?: string;
};

function normalizeString(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value?: unknown[]) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDifficulty(difficulty?: string) {
  const value = normalizeString(difficulty).toLowerCase();

  if (
    value === "beginner" ||
    value === "intermediate" ||
    value === "advanced"
  ) {
    return value;
  }

  return "beginner";
}

function normalizeCategory(category?: string) {
  const value = normalizeString(category).toLowerCase();
  return VALID_CATEGORIES.has(value) ? value : undefined;
}

function getExerciseGifUrl(exerciseId: string) {
  return `${BACKEND_BASE_URL}/api/gifs/exercise/${exerciseId}`;
}

function arraysEqual(a: string[], b: string[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function fetchRapidExerciseById(exerciseId: string): Promise<RapidExercise | null> {
  try {
    const response = await axios.get(
      `https://exercisedb.p.rapidapi.com/exercises/exercise/${exerciseId}`,
      {
        headers: {
          "X-RapidAPI-Key": RAPID_API_KEY,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );

    return response.data ?? null;
  } catch (error) {
    console.error(`❌ Failed to fetch RapidAPI exercise ${exerciseId}`);
    return null;
  }
}

function buildPatch(doc: SanityExercise, rapid: RapidExercise) {
  const patch: Record<string, unknown> = {};
  const exerciseId = String(rapid.id || doc.exerciseId || "").trim();

  if (!exerciseId) {
    return patch;
  }

  const nextName = normalizeString(rapid.name);
  const nextBodyPart = normalizeString(rapid.bodyPart);
  const nextTarget = normalizeString(rapid.target);
  const nextEquipment = normalizeString(rapid.equipment);
  const nextDescription = normalizeString(rapid.description);
  const nextSecondaryMuscles = normalizeStringArray(rapid.secondaryMuscles);
  const nextInstructions = normalizeStringArray(rapid.instructions);
  const nextDifficulty = normalizeDifficulty(rapid.difficulty);
  const nextCategory = normalizeCategory(rapid.category);
  const nextGifUrl = getExerciseGifUrl(exerciseId);

  if (normalizeString(doc.name) !== nextName && nextName) {
    patch.name = nextName;
  }

  if (normalizeString(doc.bodyPart) !== nextBodyPart && nextBodyPart) {
    patch.bodyPart = nextBodyPart;
  }

  if (normalizeString(doc.target) !== nextTarget && nextTarget) {
    patch.target = nextTarget;
  }

  if (normalizeString(doc.equipment) !== nextEquipment && nextEquipment) {
    patch.equipment = nextEquipment;
  }

  if (
    !arraysEqual(
      normalizeStringArray(doc.secondaryMuscles),
      nextSecondaryMuscles
    )
  ) {
    patch.secondaryMuscles = nextSecondaryMuscles;
  }

  if (
    !arraysEqual(normalizeStringArray(doc.instructions), nextInstructions)
  ) {
    patch.instructions = nextInstructions;
  }

  if (normalizeString(doc.description) !== nextDescription) {
    patch.description = nextDescription;
  }

  if (normalizeString(doc.gifUrl) !== nextGifUrl) {
    patch.gifUrl = nextGifUrl;
  }

  if (normalizeDifficulty(doc.difficulty) !== nextDifficulty) {
    patch.difficulty = nextDifficulty;
  }

  if (nextCategory && normalizeString(doc.category).toLowerCase() !== nextCategory) {
    patch.category = nextCategory;
  }

  if (normalizeString(doc.exerciseId) !== exerciseId) {
    patch.exerciseId = exerciseId;
  }

  return patch;
}

async function syncExercises() {
  console.log(
    `🚀 Starting RapidAPI exercise sync${DRY_RUN ? " (dry run)" : ""}...`
  );

  const exercises: SanityExercise[] = await sanity.fetch(`
    *[_type == "exercise" && defined(exerciseId)] | order(name asc) {
      _id,
      exerciseId,
      name,
      bodyPart,
      target,
      secondaryMuscles,
      equipment,
      category,
      instructions,
      gifUrl,
      difficulty,
      description
    }
  `);

  const items = LIMIT > 0 ? exercises.slice(0, LIMIT) : exercises;

  let checked = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of items) {
    checked++;
    const exerciseId = String(doc.exerciseId || "").trim();

    if (!exerciseId) {
      skipped++;
      continue;
    }

    const rapid = await fetchRapidExerciseById(exerciseId);

    if (!rapid) {
      failed++;
      continue;
    }

    const patch = buildPatch(doc, rapid);

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      updated++;
      console.log(`📝 DRY RUN ${exerciseId} ${doc.name || ""}`, patch);
      continue;
    }

    try {
      await sanity.patch(doc._id).set(patch).commit();
      updated++;
      console.log(`✅ Synced ${exerciseId} ${doc.name || ""}`, patch);
    } catch (error) {
      failed++;
      console.error(`❌ Failed to patch ${exerciseId} ${doc._id}`, error);
    }
  }

  console.log("🎉 Exercise sync finished");
  console.log(`Checked: ${checked}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

syncExercises();
