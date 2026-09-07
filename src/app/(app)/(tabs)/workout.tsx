import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type Exercise = {
  name: string;
  sets: number;
  reps: string;
};

type Day = {
  day: string;
  exercises: Exercise[];
  notes: string[];
};

type Week = {
  week: number;
  days: Day[];
};

type Plan = {
  weeks: Week[];
};

const DAY_SPLITS = ["Push", "Pull", "Legs", "Full Body"];

const FALLBACK_EXERCISES: Record<string, string[]> = {
  Push: ["Barbell Bench Press", "Dumbbell Shoulder Press", "Cable Triceps Pushdown", "Incline Dumbbell Press"],
  Pull: ["Lat Pulldown", "Seated Cable Row", "Face Pull", "Dumbbell Hammer Curl"],
  Legs: ["Back Squat", "Romanian Deadlift", "Walking Lunges", "Leg Curl"],
  "Full Body": ["Goblet Squat", "Push Ups", "One-Arm Dumbbell Row", "Plank"],
};

function normalizeName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isUsefulExerciseName(name: string) {
  if (!name) return false;
  const lowered = name.toLowerCase();
  return lowered !== "exercise" && lowered !== "training" && lowered !== "workout";
}

function progressionForWeek(weekNumber: number) {
  if (weekNumber === 1) return { sets: 3, reps: "10-12", intensity: "RPE 7" };
  if (weekNumber === 2) return { sets: 3, reps: "8-12", intensity: "RPE 7-8" };
  if (weekNumber === 3) return { sets: 4, reps: "8-10", intensity: "RPE 8" };
  return { sets: 4, reps: "6-8", intensity: "RPE 8-9" };
}

function notesForDay(day: string, weekNumber: number) {
  const progression = progressionForWeek(weekNumber);
  return [
    "Warm up 5-8 min + 2 light ramp-up sets.",
    "Rest 60-90 sec for accessories, 90-120 sec for compound lifts.",
    `Target effort: ${progression.intensity}.`,
    "Finish with 5 min cooldown and light mobility.",
    `${day} focus: keep technique strict before adding load.`,
  ];
}

function pickExercisesForDay(
  day: string,
  dayIndex: number,
  pool: string[],
  weekNumber: number
) {
  const progression = progressionForWeek(weekNumber);
  const fallback = FALLBACK_EXERCISES[day] ?? FALLBACK_EXERCISES["Full Body"];
  const source = pool.length > 0 ? pool : fallback;

  // Rotate starting index per day/week so users do not see an identical list repeatedly.
  const start = (dayIndex * 2 + weekNumber - 1) % source.length;
  const chosen = Array.from({ length: 4 }, (_, i) => source[(start + i) % source.length]);

  return chosen.map((name, idx) => ({
    name,
    sets: progression.sets,
    reps: idx === 0 && weekNumber >= 3 ? "6-8" : progression.reps,
  }));
}

function extractExercisePool(data: any) {
  const fromResult = Array.isArray(data?.result?.exercises) ? data.result.exercises : [];
  const fromRoot = Array.isArray(data?.exercises) ? data.exercises : [];
  const fromWeeks = Array.isArray(data?.weeks)
    ? data.weeks.flatMap((week: any) =>
      Array.isArray(week?.days)
        ? week.days.flatMap((day: any) =>
          Array.isArray(day?.exercises) ? day.exercises : []
        )
        : []
    )
    : [];

  const merged = [...fromResult, ...fromRoot, ...fromWeeks];
  const names = merged
    .map((ex: any) => normalizeName(ex?.name || ex?.exercise_name || ex?.title))
    .filter(isUsefulExerciseName);

  return Array.from(new Set(names));
}

function Workout() {
  const router = useRouter();

  // State for workout plan 
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planGoal, setPlanGoal] = useState<string>("");
  const [loadingPlan, setLoadingPlan] = useState(false);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";

  // Function to generate workout plan
  const generatePlan = async () => {
    try {
      setLoadingPlan(true);

      const res = await fetch(`${BACKEND_URL}/api/workout-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: "Build muscle",
          fitness_level: "Intermediate",
          preferences: ["Weight training", "Cardio"],
          schedule: {
            days_per_week: 4,
            session_duration: 60,
          },
        }),
      });

      const data = await res.json();
      console.log("PLAN RESPONSE:", data);

      if (!res.ok) {
        console.error(data);
        return;
      }

      const totalWeeks =
        Number(data?.result?.total_weeks) ||
        Number(data?.plan_duration_weeks) ||
        (Array.isArray(data?.weeks) && data.weeks.length > 0 ? data.weeks.length : 4);

      // Build a realistic pool first, then distribute by split/day.
      const exercisePool = extractExercisePool(data);

      const normalized: Plan = {
        weeks: Array.from({ length: totalWeeks }, (_, i) => ({
          week: i + 1,
          days: DAY_SPLITS.map((day, dayIndex) => ({
            day,
            exercises: pickExercisesForDay(day, dayIndex, exercisePool, i + 1),
            notes: notesForDay(day, i + 1),
          })),
        })),
      };

      setPlan(normalized);
      setPlanGoal(data?.result?.goal || data?.goal || "Workout");
    } catch (err) {
      console.error("Plan error:", err);
    } finally {
      setLoadingPlan(false);
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />

      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 🔹 HEADER */}
        <View className="pt-6 pb-6">
          <Text className="text-white text-3xl font-bold">
            Workout Hub
          </Text>
          <Text className="text-slate-400 mt-1">
            Train smarter. Stay consistent.
          </Text>
        </View>

        {/* 🔥 PRIMARY CARD */}
        <LinearGradient
          colors={["#22C55E", "#16A34A"]}
          className="rounded-3xl p-5 mb-5"
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-slate-950 text-sm font-semibold uppercase">
                Ready to Train
              </Text>

              <Text className="text-slate-950 text-3xl font-extrabold mt-2">
                Start Workout
              </Text>

              <Text className="text-slate-950 mt-2">
                Build strength & consistency
              </Text>
            </View>

            <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center">
              <Ionicons name="play" size={22} color="#020617" />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(app)/active-workout")}
            className="bg-slate-950 rounded-2xl py-4 items-center mt-5 active:scale-95"
          >
            <Text className="text-white font-semibold">
              Start Session
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* GENERATE PLAN */}
        <TouchableOpacity
          onPress={generatePlan}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 items-center"
        >
          <Text className="text-white font-semibold">
            {loadingPlan ? "Generating..." : "Generate Workout Plan"}
          </Text>
        </TouchableOpacity>

                {/* PLAN TITLE */}
        {plan && (
          <Text className="text-white text-lg font-bold mb-2">
            {planGoal} Plan
          </Text>
        )}

        {/* PLAN OUTPUT */}
        {plan && (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
            <Text className="text-white text-lg font-bold mb-3">
              Your Plan
            </Text>

            {plan.weeks.map((week, i) => (
              <View key={i} className="mb-4">
                <Text className="text-green-500 font-semibold">
                  Week {week.week}
                </Text>

                {week.days.map((day, j) => (
                  <View key={j} className="mt-2">
                    <Text className="text-white font-medium">
                      {day.day}
                    </Text>

                    {day.exercises.map((ex, k) => (
                      <Text key={k} className="text-slate-400 text-sm ml-2">
                        • {ex.name} ({ex.sets} x {ex.reps})
                      </Text>
                    ))}

                    <View className="mt-2 ml-2">
                      {day.notes.map((note, noteIndex) => (
                        <Text
                          key={noteIndex}
                          className="text-slate-500 text-xs leading-5"
                        >
                          - {note}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ⚡ QUICK ACTIONS */}
        <View className="flex-row gap-3 mb-5">
          <QuickAction
            icon="barbell-outline"
            label="Exercises"
            onPress={() => router.push("/(tabs)/exercises")}
          />
          <QuickAction
            icon="time-outline"
            label="Workout History"
            onPress={() => router.push("/(tabs)/history")}
          />
          <QuickAction
            icon="flash-outline"
            label="Quick Start"
            onPress={() => router.push("/(app)/active-workout")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 items-center active:scale-95"
    >
      <Ionicons name={icon} size={20} color="#22C55E" />
      <Text className="text-white text-sm mt-2">{label}</Text>
    </TouchableOpacity>
  );
}


export default Workout;