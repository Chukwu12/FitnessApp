export type Workout = {
  _id: string;
  date?: string;
  duration?: number;
};

//
// 🔥 STREAK CALCULATOR (REUSABLE)
//
export const calculateStreak = (workouts: Workout[]) => {
  if (!workouts.length) return 0;

  const workoutDays = new Set(
    workouts
      .filter((w) => w.date)
      .map((w) => new Date(w.date!).toDateString())
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const key = d.toDateString();

    if (workoutDays.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

//
// 🔥 TOTAL MINUTES
//
export const calculateTotalMinutes = (workouts: Workout[]) => {
  return Math.round(
    workouts.reduce((sum, w) => sum + (w.duration ?? 0), 0) / 60
  );
};

//
// 🧠 MAIN STATS ENGINE
//
export const calculateStats = (workouts: Workout[]) => {
  const totalWorkouts = workouts.length;
  const totalMinutes = calculateTotalMinutes(workouts);
  const streak = calculateStreak(workouts);

  return {
    totalWorkouts,
    totalMinutes,
    streak,
  };
};