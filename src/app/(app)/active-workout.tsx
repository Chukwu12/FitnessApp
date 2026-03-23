import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useStopwatch } from "react-timer-hook";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";

import { useWorkoutStore } from "@/store/workout-store";
import ExerciseSelectionModal from "./components/ExerciseSelectionModal";

export default function ActiveWorkout() {
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ subscribe only to what you need
  const workoutExercises = useWorkoutStore((s) => s.workoutExercises);
  const resetWorkout = useWorkoutStore((s) => s.resetWorkout);
  const weightUnit = useWorkoutStore((s) => s.weightUnit);
  const setWeightUnit = useWorkoutStore((s) => s.setWeightUnit);
  const hasHydrated = useWorkoutStore((s) => s.hasHydrated);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);

  // ✅ actions
  const addNewSet = useWorkoutStore((s) => s.addNewSet);
  const setWorkoutExercises = useWorkoutStore((s) => s.setWorkoutExercises);

  const { userId } = useAuth();
  const router = useRouter();

  // Use the stopwatch for timing with offset based on workout start time
  const { seconds, minutes, totalSeconds, reset } = useStopwatch({
    autoStart: true,
  });

  const hasExercises = workoutExercises.length > 0;
  const everyExerciseHasASet = workoutExercises.every((ex) => ex.sets.length > 0);
  const allSetsCompleted = workoutExercises.every((ex) =>
    ex.sets.every((set) => set.isCompleted)
  );

  const canCompleteWorkout =
    !isSaving && hasExercises && everyExerciseHasASet && allSetsCompleted;

  // ✅ optional but recommended for web
  if (Platform.OS === "web" && !hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
        <Text className="mt-2 text-gray-600">Loading workout...</Text>
      </View>
    );
  }

  // ✅ Reset stopwatch once when workout becomes empty
  const didResetRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (workoutExercises.length === 0 && !didResetRef.current) {
        didResetRef.current = true;
        reset();
      }

      return () => {
        didResetRef.current = false;
      };
    }, [workoutExercises.length, reset])
  );

  const getWorkoutDuration = () => {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const deleteExercise = (exerciseId: string) => {
    Alert.alert("Remove Exercise", "Remove this exercise?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeExercise(exerciseId),
      },
    ]);
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: "reps" | "weight",
    value: string
  ) => {
    setWorkoutExercises((exercises) =>
      exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set
              ),
            }
          : exercise
      )
    );
  };

  const deleteSet = (exerciseId: string, setId: string) => {
    setWorkoutExercises((exercises) =>
      exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          : exercise
      )
    );
  };

  const toggleSetCompletion = (exerciseId: string, setId: string) => {
    setWorkoutExercises((exercises) =>
      exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? { ...set, isCompleted: !set.isCompleted }
                  : set
              ),
            }
          : exercise
      )
    );
  };

  const endWorkout = async () => {
    const saved = await saveWorkoutToDatabase();

    if (saved) {
      Alert.alert("Workout Saved", "Your workout has been saved successfully.");
      // Reset workout and navigate back
      resetWorkout();
      router.replace("/(app)(tabs)/history?refresh=true");
    }
  };

  const saveWorkoutToDatabase = async (): Promise<boolean> => {
    // Check if already saving to prevent double submissions
    if (isSaving) return false;
    setIsSaving(true);

    try {
      if (!userId) {
        Alert.alert("Not signed in", "Please sign in to save workouts.");
        return false;
      }

      // Use stopwatch total seconds for workout duration
      const durationInSeconds = totalSeconds;

      // Transform exercises data to match Sanity schema
      // - Only completed sets
      // - Convert reps/weight to numbers
      // - Reference exercise by sanityId
      const exercisesForSanity = workoutExercises
        .map((ex) => {
          const completedSets = ex.sets
            .filter((s) => s.isCompleted)
            .map((s) => ({
              reps: Number(s.reps) || 0,
              weight: Number(s.weight) || 0,
              weightUnit: s.weightUnit, // 'lbs' | 'kg'
            }));

          return {
            exercise: { _type: "reference", _ref: ex.sanityId },
            sets: completedSets,
          };
        })
        // IMPORTANT: schema requires min(1) set per exercise
        .filter((ex) => ex.sets.length > 0);

      // Guard: require at least 1 completed set in the whole workout
      if (exercisesForSanity.length === 0) {
        Alert.alert("Incomplete", "Complete at least one set before saving.");
        return false;
      }

      // Send to backend (recommended)
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      if (!API_URL) {
        Alert.alert("Missing config", "EXPO_PUBLIC_API_URL is not set.");
        return false;
      }

      const res = await fetch(`${API_URL}/api/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: new Date().toISOString(),
          duration: durationInSeconds,
          exercises: exercisesForSanity,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Save workout failed:", text);
        Alert.alert("Error", "Failed to save workout. Try again.");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert(
        "Error",
        "There was an error saving your workout. Please try again."
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveWorkout = () => {
    // Are you sure you want to complete the workout? show alert
    Alert.alert(
      "Complete Workout",
      "Are you sure you want to complete the workout? You won't be able to edit it afterwards.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Complete", onPress: endWorkout },
      ]
    );
  };

  const cancelWorkout = () => {
    Alert.alert("Cancel Workout", "Are you sure you want to cancel the workout?", [
      { text: "No", style: "cancel" },
      {
        text: "End Workout",
        onPress: () => {
          resetWorkout();
          router.back();
        },
      },
    ]);
  };

  const addExercise = () => setShowExerciseSelection(true);

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      {/* safe area spacer */}
      <View
        className="bg-gray-800"
        style={{
          paddingTop: Platform.OS === "ios" ? 55 : StatusBar.currentHeight || 0,
        }}
      />

      {/* Header */}
      <View className="bg-gray-800 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-semibold">Active Workout</Text>
            <Text className="text-gray-300">{getWorkoutDuration()}</Text>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Weight Unit Toggle */}
            <View className="flex-row bg-gray-700 rounded-lg p-1">
              <TouchableOpacity
                onPress={() => setWeightUnit("lbs")}
                className={`px-3 py-1 rounded ${
                  weightUnit === "lbs" ? "bg-blue-600" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    weightUnit === "lbs" ? "text-white" : "text-gray-300"
                  }`}
                >
                  lbs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setWeightUnit("kg")}
                className={`px-3 py-1 rounded ${
                  weightUnit === "kg" ? "bg-blue-600" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    weightUnit === "kg" ? "text-white" : "text-gray-300"
                  }`}
                >
                  kg
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={cancelWorkout}
              className="bg-red-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">End Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 bg-white">
        <View className="px-6 mt-4">
          <Text className="text-center text-gray-600 mb-2">
            {workoutExercises.length} exercises
          </Text>
        </View>

        {/* If no exercises, show a message */}
        {workoutExercises.length === 0 && (
          <View className="bg-gray-50 rounded-2xl p-8 items-center mx-6">
            <Ionicons name="barbell-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 text-lg text-center mt-4 font-medium">
              No exercises yet
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Get started by adding your first exercise below
            </Text>
          </View>
        )}

        {/* All Exercises - Vertical List */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView className="flex-1 px-6 mt-4">
            {workoutExercises.map((exercise) => {
              const completedCount = exercise.sets.filter((s) => s.isCompleted)
                .length;

              return (
                <View key={exercise.id} className="mb-8">
                  {/* Exercise header */}
                  {/* ✅ IMPORTANT CHANGE:
                      - The header "card" is pressable to navigate
                      - The delete button is a separate pressable OUTSIDE the navigation pressable
                      - This avoids nested touchables (which breaks presses on web + mobile)
                   */}
                  <View className="bg-blue-50 rounded-2xl p-4 mb-3">
                    <View className="flex-row items-center justify-between">
                      {/* Left side navigates */}
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: "/exercise-details",
                            params: { id: exercise.sanityId },
                          })
                        }
                        className="flex-1"
                        activeOpacity={0.85}
                      >
                        <Text className="text-xl font-bold text-gray-900 mb-2">
                          {exercise.name}
                        </Text>
                        <Text className="text-gray-600">
                          {exercise.sets.length} sets {" • "} {completedCount} completed
                        </Text>
                      </TouchableOpacity>

                      {/* Delete Exercise Button (separate pressable) */}
                      <TouchableOpacity
                        onPress={() => deleteExercise(exercise.id)}
                        className="w-10 h-10 rounded-xl items-center justify-center bg-red-500 ml-3"
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Exercise Sets */}
                  <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
                    <Text className="text-lg font-semibold text-gray-900 mb-3">
                      Sets
                    </Text>

                    {exercise.sets.length === 0 ? (
                      <Text className="text-gray-500 text-center py-4">
                        No sets yet. Add your first set below.
                      </Text>
                    ) : (
                      exercise.sets.map((set, setIndex) => (
                        <View
                          key={set.id}
                          className={`py-3 px-3 mb-2 rounded-lg border ${
                            set.isCompleted
                              ? "bg-green-100 border-green-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="text-gray-700 font-medium w-8">
                              {setIndex + 1}
                            </Text>

                            {/* Reps */}
                            <View className="flex-1 mx-2">
                              <Text className="text-xs text-gray-500 mb-1">
                                Reps
                              </Text>
                              <TextInput
                                value={set.reps}
                                onChangeText={(value) =>
                                  updateSet(exercise.id, set.id, "reps", value)
                                }
                                placeholder="0"
                                keyboardType="numeric"
                                className={`border rounded-lg px-3 py-2 text-center ${
                                  set.isCompleted
                                    ? "bg-gray-100 border-gray-300 text-gray-500"
                                    : "bg-white border-gray-300"
                                }`}
                                editable={!set.isCompleted}
                              />
                            </View>

                            {/* Weight */}
                            <View className="flex-1 mx-2">
                              <Text className="text-xs text-gray-500 mb-1">
                                Weight
                              </Text>
                              <TextInput
                                value={set.weight}
                                onChangeText={(value) =>
                                  updateSet(exercise.id, set.id, "weight", value)
                                }
                                placeholder="0"
                                keyboardType="numeric"
                                className={`border rounded-lg px-3 py-2 text-center ${
                                  set.isCompleted
                                    ? "bg-gray-100 border-gray-300 text-gray-500"
                                    : "bg-white border-gray-300"
                                }`}
                                editable={!set.isCompleted}
                              />
                            </View>

                            <Text className="text-gray-600 w-10 text-center">
                              {set.weightUnit}
                            </Text>

                            {/* Complete Button */}
                            <TouchableOpacity
                              onPress={() =>
                                toggleSetCompletion(exercise.id, set.id)
                              }
                              className={`w-12 h-12 rounded-xl items-center justify-center mx-1 ${
                                set.isCompleted ? "bg-green-500" : "bg-gray-200"
                              }`}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name={
                                  set.isCompleted
                                    ? "checkmark"
                                    : "checkmark-outline"
                                }
                                size={20}
                                color={set.isCompleted ? "white" : "#9CA3AF"}
                              />
                            </TouchableOpacity>

                            {/* Delete Set Button */}
                            <TouchableOpacity
                              onPress={() => deleteSet(exercise.id, set.id)}
                              className="w-12 h-12 rounded-xl items-center justify-center bg-red-500 ml-1"
                              activeOpacity={0.8}
                            >
                              <Ionicons name="trash" size={16} color="white" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}

                    {/* Add New Set Button (ONE per exercise) */}
                    <TouchableOpacity
                      onPress={() => addNewSet(exercise.id)}
                      className="bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg items-center mt-2 py-3"
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="add"
                          size={16}
                          color="#3B82F6"
                          style={{ marginRight: 6 }}
                        />
                        <Text className="text-blue-600 font-medium">Add Set</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Add exercise button */}
            <TouchableOpacity
              onPress={addExercise}
              className="bg-blue-600 rounded-2xl py-4 items-center mb-8 active:bg-blue-700"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <Ionicons name="add" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold text-lg">Add Exercise</Text>
              </View>
            </TouchableOpacity>

            {/* Complete Workout Button */}
            <TouchableOpacity
              onPress={saveWorkout}
              className={`rounded-2xl py-4 items-center mb-8 ${
                canCompleteWorkout
                  ? "bg-green-600 active:bg-green-700"
                  : "bg-gray-400"
              }`}
              disabled={!canCompleteWorkout}
              activeOpacity={0.9}
            >
              {isSaving ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Saving...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Complete Workout
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <ExerciseSelectionModal
        visible={showExerciseSelection}
        onClose={() => setShowExerciseSelection(false)}
      />
    </View>
  );
}