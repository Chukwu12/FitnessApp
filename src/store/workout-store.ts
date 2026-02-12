import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";

export interface WorkoutSet {
  id: string;
  reps: string;
  weight: string;
  weightUnit: "kg" | "lbs";
  isCompleted: boolean;
}

interface WorkoutExercise {
  id: string;
  sanityId: string; // store sanity _id
  name: string;
  sets: WorkoutSet[];
}

interface WorkoutStore {
  // state
  workoutExercises: WorkoutExercise[];
  weightUnit: "kg" | "lbs";
  hasHydrated: boolean;

  // actions
  addExerciseToWorkout: (exercise: { name: string; sanityId: string }) => void;
  setWorkoutExercises: (
    exercises:
      | WorkoutExercise[]
      | ((prev: WorkoutExercise[]) => WorkoutExercise[])
  ) => void;
  setWeightUnit: (unit: "kg" | "lbs") => void;
  resetWorkout: () => void;

  // hydration action
  setHasHydrated: (v: boolean) => void;
}

// ✅ Web storage wrapper (no crash if window/localStorage isn't available)
const webStorage = {
  getItem: (name: string) => {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(name, value);
    } catch { }
  },
  removeItem: (name: string) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(name);
    } catch { }
  },
};

// ✅ Storage selector
const storage = createJSONStorage(() => {
  if (Platform.OS === "web") return webStorage as any;

  // native only
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  return AsyncStorage;
});

export const useWorkoutStore = create<WorkoutStore>()(
    persist(
      (set, get) => ({
        workoutExercises: [],
        weightUnit: "lbs",
        hasHydrated: false,

        setHasHydrated: (v) => set({ hasHydrated: v }),

        addExerciseToWorkout: (exercise) => {
          if (!get().hasHydrated && Platform.OS === "web") return;

          set((state) => ({
            workoutExercises: [
              ...state.workoutExercises,
              {
                id: crypto?.randomUUID?.() ?? Math.random().toString(),
                sanityId: exercise.sanityId,
                name: exercise.name,
                sets: [],
              },
            ],
          }));
        },

        setWorkoutExercises: (exercises) => {
          if (!get().hasHydrated && Platform.OS === "web") return;

          set((state) => ({
            workoutExercises:
              typeof exercises === "function"
                ? exercises(state.workoutExercises)
                : exercises,
          }));
        },

        setWeightUnit: (unit) => {
          if (!get().hasHydrated && Platform.OS === "web") return;
          set({ weightUnit: unit });
        },

        resetWorkout: () => {
          if (!get().hasHydrated && Platform.OS === "web") return;
          set({ workoutExercises: [] });
        },
      }),
      {
        name: "workout-store",
        storage,

        partialize: (state) => ({
          weightUnit: state.weightUnit,
          workoutExercises: state.workoutExercises,
        }),

        onRehydrateStorage: () => (state, error) => {
          state?.setHasHydrated(true); // mark hydrated either way
        },
      }
    )
);

