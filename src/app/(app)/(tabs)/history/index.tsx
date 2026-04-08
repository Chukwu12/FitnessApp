import { defineQuery } from "groq";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { client } from "@/lib/sanity/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatDuration } from "../../../../../lib/utils";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

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

  const getTotalSets = (workout: WorkoutsQueryResultItem) => {
    return (
      workout.exercises?.reduce(
        (total, ex) => total + (ex.sets?.length ?? 0),
        0
      ) ?? 0
    );
  };

  const getExercisesNames = (workout: WorkoutsQueryResultItem) => {
    return (
      workout.exercises
        ?.map((ex) => ex.exercise?.name)
        .filter((name): name is string => Boolean(name)) ?? []
    );
  };

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
