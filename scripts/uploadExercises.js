// scripts/uploadExercises.js
import 'dotenv/config';               // Load .env variables
import { createClient } from '@sanity/client';
import axios from 'axios';
console.log("Token loaded:", !!process.env.SANITY_WRITE_TOKEN);


// -----------------------------
// 1️⃣ Sanity Client Setup
// -----------------------------
const client = createClient({
  projectId: 'cwx5k0kx',             // replace with your project ID
  dataset: 'production',             // your dataset
  token: process.env.SANITY_WRITE_TOKEN, // must have write access
  useCdn: false,                     // always false for write operations
  apiVersion: '2025-12-14',          // latest date
});

// -----------------------------
// 2️⃣ RapidAPI Setup
// -----------------------------
const API_BASE = "https://exercisedb.p.rapidapi.com/exercises";
const RAPID_API_KEY = process.env.RAPID_API_KEY;
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL?.replace(/\/$/, "");
const API_HEADERS = {
  "X-RapidAPI-Key": RAPID_API_KEY,
  "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
};

if (!RAPID_API_KEY) {
  throw new Error("Missing RAPID_API_KEY");
}

if (!BACKEND_BASE_URL) {
  throw new Error("Missing BACKEND_BASE_URL");
}

// -----------------------------
// 3️⃣ Format exercises for Sanity
// -----------------------------
const formatExercise = (ex) => ({
  _type: 'exercise',
  _id: `exercise-${ex.id}`,           // prevents duplicates
  exerciseId: ex.id,
  name: ex.name,
  bodyPart: ex.bodyPart || 'N/A',
  target: ex.target || 'N/A',
  equipment: ex.equipment || 'N/A',
  instructions: ex.instructions || 'No instructions',
  gifUrl: `${BACKEND_BASE_URL}/api/gifs/exercise/${ex.id}`,
  category: ex.category || 'General', // optional extra
  level: ex.level || 'Intermediate',  // optional extra
});

// -----------------------------
// 4️⃣ Upload function
// -----------------------------
async function uploadExercises() {
  try {
    console.log("⏳ Fetching exercises from RapidAPI...");
    const { data } = await axios.get(API_BASE, { headers: API_HEADERS });

    if (!data || data.length === 0) {
      console.log('⚠️ No exercises returned from RapidAPI.');
      return;
    }

    const exercises = data.map(formatExercise);

    console.log(`⏳ Uploading ${exercises.length} exercises to Sanity...`);
    for (const exercise of exercises) {
      await client.createIfNotExists(exercise);
    }

    console.log(`✅ Uploaded ${exercises.length} exercises successfully!`);
  } catch (err) {
    console.error('❌ Error uploading exercises:', err.message);
    if (err.response) {
      console.error('Sanity/RapidAPI response:', err.response.data);
    }
  }
}

// -----------------------------
// 5️⃣ Run the upload
// -----------------------------
uploadExercises();
