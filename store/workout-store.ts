import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// --------------------
// Types
// --------------------
export type WeightUnit = "kg" | "lbs";

export interface WorkoutSet {
  id: string;
  reps: string;
  weight: string;
  weightUnit: WeightUnit;
  isCompleted: boolean;
}

export interface WorkoutExercise {
  id: string;
  sanityId: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutStore {
  workoutExercises: WorkoutExercise[];
  weightUnit: WeightUnit;

  addExerciseToWorkout: (exercise: { name: string; sanityId: string }) => void;

  setWorkoutExercises: (
    exercises:
      | WorkoutExercise[]
      | ((prev: WorkoutExercise[]) => WorkoutExercise[])
  ) => void;

  setWeightUnit: (unit: WeightUnit) => void;
  resetWorkout: () => void;
}

// --------------------
// Storage (web vs native)
// --------------------
const webStorage = {
  getItem: (name: string): Promise<string | null> =>
    Promise.resolve(
      typeof window !== "undefined" ? window.localStorage.getItem(name) : null
    ),

  setItem: (name: string, value: string): Promise<void> => {
    if (typeof window !== "undefined") window.localStorage.setItem(name, value);
    return Promise.resolve();
  },

  removeItem: (name: string): Promise<void> => {
    if (typeof window !== "undefined") window.localStorage.removeItem(name);
    return Promise.resolve();
  },
};

const storage =
  Platform.OS === "web"
    ? createJSONStorage(() => webStorage)
    : createJSONStorage(() => AsyncStorage);

// --------------------
// Store
// --------------------
export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      workoutExercises: [],
      weightUnit: "lbs",

      addExerciseToWorkout: (exercise: { name: string; sanityId: string }) =>
        set((state: WorkoutStore) => ({
          workoutExercises: [
            ...state.workoutExercises,
            {
              id: Math.random().toString(),
              sanityId: exercise.sanityId,
              name: exercise.name,
              sets: [],
            },
          ],
        })),

      setWorkoutExercises: (
        exercises:
          | WorkoutExercise[]
          | ((prev: WorkoutExercise[]) => WorkoutExercise[])
      ) =>
        set((state: WorkoutStore) => ({
          workoutExercises:
            typeof exercises === "function"
              ? exercises(state.workoutExercises)
              : exercises,
        })),

      setWeightUnit: (unit: WeightUnit) => set({ weightUnit: unit }),

      resetWorkout: () => set({ workoutExercises: [] }),
    }),
    {
      name: "workout-store",
      storage,
      // only persist what you want
      partialize: (state: WorkoutStore) => ({
        weightUnit: state.weightUnit,
      }),
    }
  )
);
