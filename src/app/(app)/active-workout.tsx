import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StatusBar,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  LayoutAnimation,
  UIManager,
  Modal,
} from "react-native";
import { useStopwatch } from "react-timer-hook";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useWorkoutStore } from "@/store/workout-store";
import { showSuccess, showError } from "@/lib/toast";
import ExerciseSelectionModal from "./components/ExerciseSelectionModal";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";

export default function ActiveWorkout() {
  const { userId, isLoaded } = useAuth();
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // ✅ subscribe only to what you need
  const workoutExercises = useWorkoutStore((s) => s.workoutExercises);
  const resetWorkout = useWorkoutStore((s) => s.resetWorkout);
  const weightUnit = useWorkoutStore((s) => s.weightUnit);
  const setWeightUnit = useWorkoutStore((s) => s.setWeightUnit);
  const hasHydrated = useWorkoutStore((s) => s.hasHydrated);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);

  const hasExercises = workoutExercises.length > 0;
  const everyExerciseHasASet = workoutExercises.every(
    (ex) => ex.sets.length > 0
  );
  const allSetsCompleted = workoutExercises.every((ex) =>
    ex.sets.every((set) => set.isCompleted)
  );

  const canCompleteWorkout =
    !isSaving && hasExercises && everyExerciseHasASet && allSetsCompleted;

  // ✅ new: actions
  const addNewSet = useWorkoutStore((s) => s.addNewSet);
  const setWorkoutExercises = useWorkoutStore((s) => s.setWorkoutExercises);
  const completeWorkout = useWorkoutStore((s) => s.completeWorkout);

  const handleAddNewSet = (exerciseId: string) => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    addNewSet(exerciseId);
  };

  const deleteExercise = (exerciseId: string) => {
    console.log("deleteExercise called with", exerciseId);

    if (Platform.OS === "web") {
      const shouldDelete = window.confirm("Remove this exercise?");
      if (shouldDelete) {
        console.log("web confirm true, calling removeExercise");
        LayoutAnimation.configureNext({
          duration: 250,
          create: { type: "easeInEaseOut", property: "opacity" },
          update: { type: "easeInEaseOut" },
          delete: { type: "easeInEaseOut", property: "opacity" },
        });
        removeExercise(exerciseId);
        showSuccess("Exercise removed", "Removed from workout");
      } else {
        console.log("web confirm false, cancelling");
      }
      return;
    }

    Alert.alert("Remove Exercise", "Remove this exercise?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          console.log("Remove pressed, calling removeExercise");
          LayoutAnimation.configureNext({
            duration: 250,
            create: { type: "easeInEaseOut", property: "opacity" },
            update: { type: "easeInEaseOut" },
            delete: { type: "easeInEaseOut", property: "opacity" },
          });
          removeExercise(exerciseId);
          showSuccess("Exercise removed", "Removed from workout");
        },
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
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
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

  //Use the stopwatch for timing with offset based on workout start time
  const router = useRouter();
  const { seconds, minutes, totalSeconds, reset } = useStopwatch({
    autoStart: true,
  });

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

  const saveWorkout = () => {
    if (workoutExercises.length === 0) return;
    setShowSummary(true);
  };

  const endWorkout = async () => {
    const saved = await saveWorkoutToDatabase();

    if (saved) {
      showSuccess("Workout complete 🎉", "Great job!");
      //Reset workout and navigate back
      resetWorkout();
      router.replace("/(app)/(tabs)/history?refresh=true");
    }
  };

  const saveWorkoutToDatabase = async (): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);

    try {
      if (!isLoaded) {
        Alert.alert(
          "Please wait",
          "Authentication is still loading. Try again in a moment."
        );
        return false;
      }

      if (!userId) {
        Alert.alert("Not signed in", "Please sign in to save your workout.");
        return false;
      }

      if (!BACKEND_URL) {
        Alert.alert("Missing config", "EXPO_PUBLIC_BACKEND_URL is not set.");
        return false;
      }

      const durationInSeconds = totalSeconds;

      // 1) Build exercises payload (only completed sets)
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
            exercise: {
              _type: "reference",
              _ref: ex.sanityId,
            },
            sets: completedSets,
          };
        })
        // 2) IMPORTANT: remove exercises that have 0 completed sets (schema requires min(1))
        .filter((ex) => ex.sets.length > 0);

      // Optional guard: require at least 1 completed set in the workout
      if (exercisesForSanity.length === 0) {
        Alert.alert("Incomplete", "Complete at least one set before saving.");
        return false;
      }

      const workoutData = {
        userId,
        date: new Date().toISOString(),
        duration: durationInSeconds,
        exercises: exercisesForSanity,
      };

      // Keep backend payload clean, but support direct Sanity writes if endpoint changes.
      const isDirectSanityEndpoint = BACKEND_URL.includes("api.sanity.io");
      const requestPayload = isDirectSanityEndpoint
        ? { _type: "workout", ...workoutData }
        : workoutData;

      // 3) Send to backend (recommended)
      const res = await fetch(`${BACKEND_URL}/api/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Save workout failed:", text);
        let message = "Failed to save workout. Try again.";
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) {
            message = parsed.error;
          }
        } catch {
          // Keep default message if backend returns non-JSON text.
        }
        Alert.alert("Error", message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error saving workout:", err);
      Alert.alert(
        "Error",
        "There was an error saving your workout. Please try again."
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const cancelWorkout = () => {
    Alert.alert(
      "Cancel Workout",
      "Are you sure you want to cancel the workout?",
      [
        { text: "No", style: "cancel" },
        {
          text: "End Workout",
          onPress: () => {
            resetWorkout();
            router.back();
          },
        },
      ]
    );
  };

    // Calculate total sets in the workout
  const totalSets = workoutExercises.reduce((total, exercise) => {
    return total + exercise.sets.length;
  }, 0);

  // Calculate total completed sets
  const completedSets = workoutExercises.reduce((total, exercise) => {
    return total + exercise.sets.filter((set) => set.isCompleted).length;
  }, 0);

    // Calculate progress percentage for the progress bar
  const progressPercent =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

      // Show exercise selection modal
  const addExercise = () => setShowExerciseSelection(true);

    // Total exercises count for summary
  const totalExercises = workoutExercises.length;


  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* 🔝 HEADER */}
      <View className="px-4 pt-4 pb-3 border-b border-slate-800">
        <View className="flex-row items-center justify-between">
          {/* TITLE + TIMER */}
          <View>
            <Text className="text-white text-lg font-bold">Active Workout</Text>
            <Text className="text-green-500 text-sm mt-1">
              {getWorkoutDuration()}
            </Text>
          </View>

          {/* CONTROLS */}
          <View className="flex-row items-center gap-3">
            {/* UNIT TOGGLE */}
            <View className="flex-row bg-slate-800 rounded-xl overflow-hidden">
              <TouchableOpacity
                onPress={() => setWeightUnit("lbs")}
                activeOpacity={0.8}
                className={`px-3 py-1 active:scale-95 ${weightUnit === "lbs" ? "bg-green-500" : ""
                  }`}
              >
                <Text
                  className={
                    weightUnit === "lbs" ? "text-slate-950" : "text-slate-400"
                  }
                >
                  lbs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setWeightUnit("kg")}
                activeOpacity={0.8}
                className={`px-3 py-1 active:scale-95 ${weightUnit === "kg" ? "bg-green-500" : ""
                  }`}
              >
                <Text
                  className={
                    weightUnit === "kg" ? "text-slate-950" : "text-slate-400"
                  }
                >
                  kg
                </Text>
              </TouchableOpacity>
            </View>

            {/* END */}
            <TouchableOpacity
              onPress={cancelWorkout}
              activeOpacity={0.8}
              className="bg-red-500 px-3 py-2 rounded-xl active:scale-95"
            >
              <Text className="text-white text-xs font-semibold">End</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 📜 CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        className="px-4"
      >
        {/* 📊 SUMMARY */}
        <View className="bg-slate-900 border border-slate-700 rounded-3xl p-5 mt-4 mb-5">
          {/* TITLE */}
          <Text className="text-white font-semibold text-base">
            Workout Progress
          </Text>

          {/* META INFO */}
          <Text className="text-slate-400 text-sm mt-1">
            {workoutExercises.length} exercise
            {workoutExercises.length !== 1 ? "s" : ""} • {completedSets}/
            {totalSets} sets completed
          </Text>
          <View className="h-2 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
            <View
              style={{ width: `${progressPercent}%` }}
              className="h-2 bg-green-500 rounded-full"
            />
          </View>
        </View>

        {workoutExercises.length === 0 && (
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 items-center mt-2">
            <View className="h-14 w-14 rounded-2xl bg-slate-800 items-center justify-center mb-4">
              <Ionicons name="barbell-outline" size={24} color="#22C55E" />
            </View>

            <Text className="text-white text-lg font-semibold">
              No exercises yet
            </Text>

            <Text className="text-slate-400 text-center mt-2 leading-6">
              Add your first exercise below to start tracking sets, reps, and
              weight.
            </Text>
          </View>
        )}

        {/* 🏋️ EXERCISES */}
        {workoutExercises.map((exercise) => {
          const completedCount = exercise.sets.filter(
            (s) => s.isCompleted
          ).length;

          return (
            <View
              key={exercise.id}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-5 mb-5"
            >
              {/* HEADER */}
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-semibold">
                  {exercise.name}
                </Text>

                <TouchableOpacity
                  onPress={() => deleteExercise(exercise.id)}
                  activeOpacity={0.8}
                  className="active:scale-95"
                >
                  <Ionicons name="trash-outline" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text className="text-slate-400 text-sm mt-1">
                {exercise.sets.length} sets • {completedCount} completed
              </Text>

              {/* SETS */}
              <View className="mt-4">
                {exercise.sets.length === 0 ? (
                  // 💤 EMPTY SET STATE
                  <View className="bg-slate-800/70 rounded-2xl p-4 items-center">
                    <Text className="text-slate-400 text-sm">
                      No sets yet. Add your first set below.
                    </Text>
                  </View>
                ) : (
                  // 🔁 LOOP THROUGH ALL SETS
                  exercise.sets.map((set, index) => (
                    <View
                      key={set.id}
                      className={`mb-3 rounded-2xl p-3 border ${set.isCompleted
                          ? "bg-green-500/15 border-green-500/30"
                          : "bg-slate-800 border-slate-700"
                        }`}
                    >
                      {/* 🔝 TOP ROW */}
                      <View className="flex-row items-end">
                        {/* 🔢 SET NUMBER */}
                        <View
                          className={`h-10 w-10 rounded-xl items-center justify-center mr-3 ${set.isCompleted ? "bg-green-500" : "bg-slate-700"
                            }`}
                        >
                          <Text
                            className={
                              set.isCompleted
                                ? "text-slate-950 font-semibold"
                                : "text-white font-semibold"
                            }
                          >
                            {index + 1}
                          </Text>
                        </View>

                        {/* 📥 REPS INPUT */}
                        <View className="flex-1 mr-2">
                          <Text className="text-slate-400 text-xs mb-1">
                            Reps
                          </Text>
                          <TextInput
                            value={set.reps}
                            onChangeText={(value) =>
                              updateSet(exercise.id, set.id, "reps", value)
                            }
                            placeholder="0"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                            editable={!set.isCompleted}
                            className={`rounded-xl px-3 py-3 text-center ${set.isCompleted
                                ? "bg-slate-700 text-slate-400"
                                : "bg-slate-900 text-white border border-slate-600"
                              }`}
                          />
                        </View>

                        {/* 🏋️ WEIGHT INPUT */}
                        <View className="flex-1 mr-2">
                          <Text className="text-slate-400 text-xs mb-1">
                            Weight
                          </Text>
                          <TextInput
                            value={set.weight}
                            onChangeText={(value) =>
                              updateSet(exercise.id, set.id, "weight", value)
                            }
                            placeholder="0"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                            editable={!set.isCompleted}
                            className={`rounded-xl px-3 py-3 text-center ${set.isCompleted
                                ? "bg-slate-700 text-slate-400"
                                : "bg-slate-900 text-white border border-slate-600"
                              }`}
                          />
                        </View>

                        {/* ⚖️ UNIT */}
                        <View className="items-center justify-center px-2 mt-5">
                          <Text className="text-slate-300 text-sm font-medium">
                            {set.weightUnit}
                          </Text>
                        </View>
                      </View>

                      {/* 🔻 ACTION ROW */}
                      <View className="flex-row justify-end mt-3">
                        {/* ✅ COMPLETE SET BUTTON */}
                        <TouchableOpacity
                          onPress={() => {
                            if (!set.isCompleted) showSuccess("Set completed ✅");
                            toggleSetCompletion(exercise.id, set.id);
                          }}
                          className={`h-11 w-11 rounded-xl items-center justify-center mr-2 active:scale-95 ${set.isCompleted ? "bg-green-500" : "bg-slate-700"
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
                            color={set.isCompleted ? "#020617" : "#CBD5E1"}
                          />
                        </TouchableOpacity>

                        {/* 🗑 DELETE SET BUTTON */}
                        <TouchableOpacity
                          onPress={() => deleteSet(exercise.id, set.id)}
                          className="h-11 w-11 rounded-xl items-center justify-center bg-red-500/90 active:scale-95"
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* ADD SET */}
              <TouchableOpacity
                onPress={() => handleAddNewSet(exercise.id)}
                activeOpacity={0.8}
                className="mt-4 border border-dashed border-slate-600 py-3 rounded-xl items-center active:scale-95"
              >
                <Text className="text-green-500 font-semibold">+ Add Set</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* 🔻 BOTTOM */}
      <View className="absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 px-4 py-3">
        <Text className="text-slate-400 text-center text-sm mb-3">
          Add exercises and complete all sets to finish your workout
        </Text>
        {/* ADD EXERCISE */}
        <TouchableOpacity
          onPress={addExercise}
          activeOpacity={0.8}
          className="bg-slate-800 rounded-2xl py-4 items-center mb-3 active:scale-95"
        >
          <Text className="text-white font-semibold">+ Add Exercise</Text>
        </TouchableOpacity>
        {/* COMPLETE WORKOUT */}
        <TouchableOpacity
          onPress={saveWorkout}
          activeOpacity={0.8}
          className={`rounded-2xl py-4 items-center active:scale-95 ${canCompleteWorkout ? "bg-green-500" : "bg-gray-600"
            }`}
          disabled={!canCompleteWorkout}
        >
          <Text className="text-slate-950 font-bold">Complete Workout</Text>
        </TouchableOpacity>
      </View>
      <ExerciseSelectionModal
        visible={showExerciseSelection}
        onClose={() => setShowExerciseSelection(false)}
      />

      {/* 🎉 WORKOUT SUMMARY MODAL */}
      <Modal visible={showSummary} transparent animationType="fade">
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="w-full bg-slate-900 rounded-3xl p-6 border border-slate-800">

            {/* Title */}
            <Text className="text-2xl font-bold text-white text-center mb-6">
              🎉 Workout Complete
            </Text>

            {/* Stats */}
            <View className="bg-slate-800 rounded-2xl p-4 mb-6 gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-400 text-sm">Exercises</Text>
                <Text className="text-white font-semibold">{totalExercises}</Text>
              </View>
              <View className="h-px bg-slate-700" />
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-400 text-sm">Sets Completed</Text>
                <Text className="text-white font-semibold">
                  {completedSets} / {totalSets}
                </Text>
              </View>
              <View className="h-px bg-slate-700" />
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-400 text-sm">Duration</Text>
                <Text className="text-white font-semibold">{getWorkoutDuration()}</Text>
              </View>
            </View>

            {/* CTA Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={async () => {
                  setShowSummary(false);
                  completeWorkout(totalSeconds);
                  await endWorkout();
                }}
                activeOpacity={0.8}
                className="bg-green-500 py-4 rounded-2xl items-center active:scale-95"
              >
                <Text className="text-slate-900 font-bold text-base">Save Workout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowSummary(false)}
                activeOpacity={0.8}
                className="bg-slate-800 py-4 rounded-2xl items-center active:scale-95"
              >
                <Text className="text-slate-300 font-medium">Go Back</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
