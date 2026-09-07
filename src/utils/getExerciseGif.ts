const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

export const getExerciseGif = (exerciseId: string) => {
  if (!exerciseId || !BACKEND_URL) return undefined;
  return `${BACKEND_URL}/api/gifs/exercise/${exerciseId}`;
};
