require("../load-env.cjs");
const sanity = require("./sanityClient.cjs");

async function listMissingExerciseIds() {
  try {
    const exercises = await sanity.fetch(
      `*[_type == "exercise" && (!defined(exerciseId) || exerciseId == null)]{
        _id,
        name
      }`
    );

    if (exercises.length === 0) {
      console.log("✅ All exercises have exerciseId set!");
      return;
    }

    console.log(`⚠️ Exercises missing exerciseId (${exercises.length}):\n`);
    exercises.forEach((ex: { _id: string; name: string }) => {
      console.log(`_id: ${ex._id} | name: ${ex.name}`);
    });
  } catch (err) {
    console.error("Error fetching exercises:", err);
  }
}

listMissingExerciseIds();
