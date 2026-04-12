import { defineQuery } from "groq";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { client } from "@/lib/sanity/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatDuration } from "../../../../../lib/utils";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { LineChart } from "react-native-chart-kit";

// ✅ Query stays the same
export const getWorkoutsQuery = defineQuery(`
*[_type == "workout" && userId == $userId]
| order(date desc) {
  _id,
  date,
  duration,
  exercises[]{
    _key,
    exercise->{
      _id,
      exerciseId,
      name,
      bodyPart,
      target,
      equipment,
      difficulty,
      tags,
      gifUrl
    },
    sets[]{
      _key,
      reps,
      weight,
      weightUnit
    }
  }
}
`);

// ✅ Define the REAL result shape of the query
type WorkoutsQueryResultItem = {
  _id: string;
  date?: string;
  duration?: number;
  exercises?: Array<{
    _key: string;
    exercise?: {
      _id: string;
      exerciseId?: string;
      name?: string;
      bodyPart?: string;
      target?: string;
      equipment?: string;
      difficulty?: "beginner" | "intermediate" | "advanced";
      tags?: string[];
      gifUrl?: string;
    };
    sets?: Array<{
      _key: string;
      reps?: number;
      weight?: number;
      weightUnit?: "lbs" | "kg";
    }>;
  }>;
};

// Helper to get last 7 days with labels for the chart
const getLast7Days = () => {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    days.push({
      date: d,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }

  return days;
};

// Helper to calculate total volume of a workout
const getTotalSets = (workout: WorkoutsQueryResultItem) => {
  return (
    workout.exercises?.reduce(
      (total: number, ex) => {
        return total + (ex.sets?.length ?? 0);
      },
      0
    ) ?? 0
  );
};

// 🔥 New helper to calculate total volume of a workout
const calculateWorkoutVolume = (workout: WorkoutsQueryResultItem) => {
  return (
    workout.exercises?.reduce((total: number, ex) => {
      const exerciseVolume =
        ex.sets?.reduce((sum: number, set) => {
          return sum + (set.reps ?? 0) * (set.weight ?? 0);
        }, 0) ?? 0;

      return total + exerciseVolume;
    }, 0) ?? 0
  );
};

const getMuscleGroup = (exercise: any) => {
  const bodyPart = exercise?.bodyPart?.toLowerCase();
  const target = exercise?.target?.toLowerCase();

  // PRIMARY SOURCE: bodyPart (most reliable from API)
  if (bodyPart === "chest") return "Chest";
  if (bodyPart === "back") return "Back";
  if (bodyPart === "upper legs" || bodyPart === "lower legs") return "Legs";
  if (bodyPart === "shoulders") return "Shoulders";
  if (bodyPart === "upper arms") return "Arms";
  if (bodyPart === "waist") return "Core";

  // FALLBACK: target muscle
  if (target?.includes("biceps") || target?.includes("triceps")) return "Arms";
  if (target?.includes("quadriceps") || target?.includes("hamstrings")) return "Legs";
  if (target?.includes("pectoralis")) return "Chest";
  if (target?.includes("latissimus")) return "Back";
  if (target?.includes("deltoid")) return "Shoulders";
  if (target?.includes("abdominals")) return "Core";

  return "Other";
};


const getMuscleVolume = (workouts: WorkoutsQueryResultItem[]) => {
  const groups: Record<string, number> = {
    Chest: 0,
    Back: 0,
    Legs: 0,
    Arms: 0,
    Shoulders: 0,
    Core: 0,
    Other: 0,
  };

  workouts.forEach((w) => {
    w.exercises?.forEach((ex) => {
      const exercise = ex.exercise;
      const group = getMuscleGroup(exercise);

      const volume =
        ex.sets?.reduce((sum, set) => {
          return sum + (set.reps ?? 0) * (set.weight ?? 0);
        }, 0) ?? 0;

      groups[group] += volume;
    });
  });

  return groups;
};


export default function HistoryPage() {
  const { user } = useUser();
  const [workouts, setWorkouts] = useState<WorkoutsQueryResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { refresh } = useLocalSearchParams();
  const router = useRouter();

  const fetchWorkouts = async () => {
    if (!user?.id) return;

    console.log("Clerk user id:", user.id);

    try {
      // ✅ Type the fetch result so it can't become string[]
      const results = await client.fetch<WorkoutsQueryResultItem[]>(
        getWorkoutsQuery,
        { userId: user.id }
      );

      console.log("Results:", results);
      setWorkouts(results);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user?.id]);

  useEffect(() => {
    if (refresh === "true") {
      fetchWorkouts();
      router.replace("/(app)/(tabs)/history");
    }
  }, [refresh]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatWorkoutDuration = (seconds?: number) => {
    if (!seconds) return "Duration not recorded";
    return formatDuration(seconds);
  };


  const getExercisesNames = (workout: WorkoutsQueryResultItem) => {
    return (
      workout.exercises
        ?.map((ex) => ex.exercise?.name)
        .filter((name): name is string => Boolean(name)) ?? []
    );
  };

  // Prepare data for the weekly chart
  const screenWidth = Dimensions.get("window").width;

  const weeklyData = useMemo(() => {
    const days = getLast7Days();

    return {
      labels: days.map((d) => d.label),
      datasets: [
        {
          data: days.map((d) => {
            const dayStr = d.date.toDateString();

            const workoutsForDay = workouts.filter((w) => {
              if (!w.date) return false;
              return new Date(w.date).toDateString() === dayStr;
            });

            // 🔥volume instead of count
            return workoutsForDay.reduce((sum, w) => {
              return sum + calculateWorkoutVolume(w);
            }, 0);
          }),
        },
      ],
    };
  }, [workouts]);

  const muscleData = useMemo(() => {
    const data = getMuscleVolume(workouts);

    return {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
        },
      ],
    };
  }, [workouts]);


  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">
            Workout History
          </Text>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3882F6" />
            <Text className="text-gray-600 mt-4">Loading your workouts...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }


  // 🔥 Helper to find the all-time PR (heaviest weight lifted) across all workouts
  const getPR = () => {
    let max = 0;
    let exerciseName = "";

    workouts.forEach((w: WorkoutsQueryResultItem) => {
      w.exercises?.forEach((ex) => {
        ex.sets?.forEach((set) => {
          const weight = set.weight ?? 0;

          if (weight > max) {
            max = weight;
            exerciseName = ex.exercise?.name ?? "Unknown";
          }
        });
      });
    });

    return { max, exerciseName };
  };

  const pr = getPR();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 border-b border-slate-800">
        <Text className="text-2xl font-bold text-white">
          Workout History
        </Text>
        <Text className="text-slate-400 mt-1">
          {workouts.length} workout{workouts.length !== 1 ? "s" : ""} completed
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* 🏆 Personal Record */}
        <View className="bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-4">
          <Text className="text-yellow-400 font-semibold">
            🏆 Personal Record
          </Text>

          <Text className="text-white text-xl font-bold mt-1">
            {pr.max} lbs
          </Text>

          <Text className="text-slate-400 text-sm">
            {pr.exerciseName}
          </Text>
        </View>

        {/* 🔥 Weekly Chart */}
        <View className="px-4 mt-4">
          <Text className="text-white font-semibold mb-2">
            Weekly Activity
          </Text>


          {/* Weekly Activity Chart */}
          <LineChart
            data={weeklyData}
            width={screenWidth - 32}
            height={180}
            chartConfig={{
              backgroundGradientFrom: "#020617",
              backgroundGradientTo: "#020617",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
              labelColor: () => "#94A3B8",
              propsForDots: {
                r: "4",
              },
            }}
            bezier
            style={{
              borderRadius: 16,
            }}
          />
        </View>

        {/* 🔥 Muscle Group Breakdown Chart */}
        <View className="mt-6">
          <Text className="text-white font-semibold mb-2">
            💪 Muscle Group Breakdown
          </Text>

          <LineChart
            data={muscleData}
            width={Dimensions.get("window").width - 32}
            height={200}
            chartConfig={{
              backgroundGradientFrom: "#020617",
              backgroundGradientTo: "#020617",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: () => "#94A3B8",
              propsForDots: {
                r: "4",
              },
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        </View>




        {/* WORKOUT LIST */}
        {workouts.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <Ionicons name="fitness-outline" size={64} color="#64748B" />
            <Text className="text-xl font-semibold text-white mt-4">
              No workouts yet
            </Text>
            <Text className="text-slate-400 text-center mt-2">
              Your completed workouts will appear here
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {workouts.map((workout) => (
              <TouchableOpacity
                key={workout._id}
                activeOpacity={0.85}
                onPress={() => {
                  router.push({
                    pathname: "/history/workout-record",
                    params: { workoutId: workout._id },
                  });
                }}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 active:scale-95"
              >
                {/* Top Row */}
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-white font-semibold text-lg">
                      {formatDate(workout.date || "")}
                    </Text>

                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color="#94A3B8"
                      />
                      <Text className="text-slate-400 ml-2 text-sm">
                        {formatWorkoutDuration(workout.duration)}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-slate-800 rounded-full w-12 h-12 items-center justify-center">
                    <Ionicons
                      name="fitness-outline"
                      size={22}
                      color="#22C55E"
                    />
                  </View>
                </View>

                {/* Stats Row */}
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="bg-slate-800 rounded-lg px-3 py-2">
                    <Text className="text-slate-300 text-sm font-medium">
                      {workout.exercises?.length ?? 0} exercises
                    </Text>
                  </View>

                  <View className="bg-slate-800 rounded-lg px-3 py-2">
                    <Text className="text-slate-300 text-sm font-medium">
                      {getTotalSets(workout)} sets
                    </Text>
                  </View>
                </View>

                {/* Exercise Preview */}
                {workout.exercises && workout.exercises.length > 0 && (
                  <View>
                    <Text className="text-slate-400 text-xs mb-2">
                      Exercises
                    </Text>

                    <View className="flex-row flex-wrap">
                      {getExercisesNames(workout)
                        .slice(0, 3)
                        .map((name, index) => (
                          <View
                            key={index}
                            className="bg-slate-800 rounded-lg px-3 py-1 mr-2 mb-2"
                          >
                            <Text className="text-slate-300 text-xs font-medium">
                              {name}
                            </Text>
                          </View>
                        ))}

                      {getExercisesNames(workout).length > 3 && (
                        <View className="bg-slate-700 rounded-lg px-3 py-1 mr-2 mb-2">
                          <Text className="text-slate-400 text-xs font-medium">
                            +{getExercisesNames(workout).length - 3} more
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
