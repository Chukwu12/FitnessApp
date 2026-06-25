import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { defineQuery } from "groq";
import { client } from "@/lib/sanity/client";
import { useUser } from "@clerk/clerk-expo";
import { formatDuration } from "lib/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";



const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;



export const getWorkoutRecordQuery = defineQuery(`
*[_type == "workout" && _id == $workoutId && userId == $userId][0]{
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

type WorkoutRecord = {
  _id: string;
  date?: string;
  duration?: number;
  exercises?: Array<{
    _key: string;
    exercise?: { name?: string };
    sets?: Array<{ _key: string; reps?: number; weight?: number; weightUnit?: string }>;
  }>;
};



export default function WorkoutRecord() {
  const { user } = useUser();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [workout, setWorkout] = useState<WorkoutRecord | null>(null);
  const router = useRouter();


  useEffect(() => {
    const fetchWorkout = async () => {
      if (!workoutId || !user?.id) return;

      try {
        const result = await client.fetch(getWorkoutRecordQuery, {
          workoutId,
          userId: user.id,
        });
        setWorkout(result);
      } catch (error) {
        console.error("Error fetching workout", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId, user?.id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unkown Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};


  const formatWorkoutDuration = (seconds?: number) => {
    if (!seconds) return "Duration not recorded";
    return formatDuration(seconds);
  };

  const getTotalSets = () => {
  return (
    workout?.exercises?.reduce((total, exercise) => total + (exercise.sets?.length ?? 0), 0) ?? 0
  );
};


  const getTotalVolume = () => {
    let totalVolume = 0;
    let unit = 'lbs';

    workout?.exercises?.forEach((exercise) => {
      exercise.sets?.forEach((set) => {
        if (set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
          unit = set.weightUnit || 'lbs';
        }
      });
    });

    return { volume: totalVolume, unit };
  };

 const handleDeleteWorkout = () => {
  const message = "Are you sure you want to delete this workout? This can't be undone.";

  if (Platform.OS === "web") {
    const ok = window.confirm(message);
    if (ok) deleteWorkout();
    return;
  }

  Alert.alert("Delete Workout", message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: deleteWorkout },
  ]);
};


const deleteWorkout = async () => {
  if (!workoutId) return;
  if (!BACKEND_URL) {
    Alert.alert("Config error", "Missing EXPO_PUBLIC_BACKEND_URL");
    return;
  }

  setDeleting(true);
  try {
    const res = await fetch(`${BACKEND_URL}/api/delete-workout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || `Delete failed (${res.status})`);
    }

    router.replace("/(app)/(tabs)/history?refresh=true");
  } catch (err) {
    console.error("Delete workout failed:", err);
    Alert.alert("Error", "Failed to delete workout. Please try again.");
  } finally {
    setDeleting(false);
  }
};




  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size='large' color='#3B82F6' />;
          <Text className="text-gray-600 mt-4">Loading workout ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 bg-gray-5-">
        <View className="flex-1 items-center jusifty-center">
          <Ionicons name="alert-circle-outline" size={64} color='#EF4444' />
          <Text className="text-xl font-semibold text-gray-900 mt-4">
            Workout Not Found
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            This workout record could not be found.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="bg-blue-600 px-6 py-3 rounded-lg mt-6 active:scale-95">
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { volume, unit } = getTotalVolume();

  return (
  <SafeAreaView className="flex-1 bg-slate-950">
    <ScrollView className="flex-1">

      {/* 🔥 HEADER / SUMMARY */}
      <View className="px-6 pt-6 pb-5 border-b border-slate-800">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-white">
            Workout Summary
          </Text>

          <TouchableOpacity
            onPress={handleDeleteWorkout}
            disabled={deleting}
            activeOpacity={0.8}
            className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center active:scale-95"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#020617" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#020617" />
                <Text className="text-black font-semibold ml-2">Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
          <Text className="text-slate-300 ml-3">
            {formatDate(workout.date)} • {formatTime(workout.date)}
          </Text>
        </View>

        {/* Duration */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="time-outline" size={18} color="#94A3B8" />
          <Text className="text-slate-300 ml-3">
            {formatWorkoutDuration(workout.duration)}
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row items-center gap-3 mt-2">
          <View className="bg-slate-900 px-3 py-2 rounded-lg">
            <Text className="text-slate-300 text-sm">
              {workout.exercises?.length ?? 0} exercises
            </Text>
          </View>

          <View className="bg-slate-900 px-3 py-2 rounded-lg">
            <Text className="text-slate-300 text-sm">
              {getTotalSets()} sets
            </Text>
          </View>

          {volume > 0 && (
            <View className="bg-slate-900 px-3 py-2 rounded-lg">
              <Text className="text-slate-300 text-sm">
                {volume.toLocaleString()} {unit}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 🔥 EXERCISES */}
      <View className="px-4 py-5 gap-4">
        {workout.exercises?.map((exerciseData, index) => {
          const exerciseVolume =
            exerciseData.sets?.reduce(
              (total, s) => total + (s.weight || 0) * (s.reps || 0),
              0
            ) ?? 0;

          return (
            <View
              key={exerciseData._key}
              className="bg-slate-900 rounded-2xl p-5 border border-slate-800"
            >
              {/* Exercise Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">
                    {exerciseData.exercise?.name || "Unknown Exercise"}
                  </Text>

                  <Text className="text-slate-400 text-sm mt-1">
                    {exerciseData.sets?.length ?? 0} sets
                  </Text>
                </View>

                <View className="bg-slate-800 w-9 h-9 rounded-full items-center justify-center">
                  <Text className="text-slate-300 font-semibold">
                    {index + 1}
                  </Text>
                </View>
              </View>

              {/* Sets */}
              <View className="gap-2">
                {exerciseData.sets?.map((set, setIndex) => (
                  <View
                    key={set._key}
                    className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    {/* Left */}
                    <View className="flex-row items-center">
                      <View className="bg-slate-700 w-7 h-7 rounded-full items-center justify-center mr-3">
                        <Text className="text-xs text-slate-300">
                          {setIndex + 1}
                        </Text>
                      </View>

                      <Text className="text-white font-medium">
                        {set.reps ?? 0} reps
                      </Text>
                    </View>

                    {/* Right */}
                    {!!set.weight && (
                      <View className="flex-row items-center">
                        <Ionicons
                          name="barbell-outline"
                          size={16}
                          color="#94A3B8"
                        />
                        <Text className="text-slate-300 ml-2">
                          {set.weight} {set.weightUnit || "lbs"}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Volume */}
              {exerciseVolume > 0 && (
                <View className="mt-4 pt-4 border-t border-slate-800 flex-row justify-between">
                  <Text className="text-slate-400 text-sm">
                    Exercise Volume
                  </Text>

                  <Text className="text-white font-medium text-sm">
                    {exerciseVolume.toLocaleString()}{" "}
                    {exerciseData.sets?.[0]?.weightUnit || "lbs"}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  </SafeAreaView>
);
}
