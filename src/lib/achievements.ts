export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  type: "workouts" | "streak";
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_workout",
    title: "First Workout",
    description: "Complete your first workout",
    icon: "trophy-outline",
    requirement: 1,
    type: "workouts",
  },
  {
    id: "three_day_streak",
    title: "3-Day Streak",
    description: "Stay consistent for 3 days",
    icon: "flame-outline",
    requirement: 3,
    type: "streak",
  },
  {
    id: "ten_workouts",
    title: "10 Workouts",
    description: "Complete 10 workouts",
    icon: "barbell-outline",
    requirement: 10,
    type: "workouts",
  },
];

export const evaluateAchievements = (
  workoutsCount: number,
  streak: number
) => {
  return ACHIEVEMENTS.map((a) => {
    let progress = 0;

    if (a.type === "workouts") {
      progress = workoutsCount;
    }

    if (a.type === "streak") {
      progress = streak;
    }

    return {
      ...a,
      unlocked: progress >= a.requirement,
      progress,
    };
  });
};