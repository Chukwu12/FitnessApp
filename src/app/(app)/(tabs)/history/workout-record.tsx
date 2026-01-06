import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { defineQuery } from "groq";
import { client } from "@/lib/client";
import { useUser } from "@clerk/clerk-expo";
import { formatDuration } from "lib/utils";

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

type WorkoutRecord = typeof getWorkoutRecordQuery.result;

export default function WorkoutRecord() {
  const { user } = useUser();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [workout, setWorkout] = useState<WorkoutRecord | null>(null);

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
    return date.toLocaleDateString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: "true",
    });
  };

  const formatWorkoutDuration = (seconds?: number) => {
    if (!seconds) return "Duration not recorded";
    return formatDuration(seconds);
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      <Text>Workout Record</Text>
      <Text>ID: {workout?._id ?? "Not found"}</Text>
    </View>
  );
}
