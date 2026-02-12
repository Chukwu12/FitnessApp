import React, { useState } from "react";
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
} from "react-native";
import { useStopwatch } from "react-timer-hook";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useWorkoutStore } from "../../store/workout-store";
import ExerciseSelectionModal from "./components/ExerciseSelectionModal";

export default function ActiveWorkout() {
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);

  // ✅ subscribe only to what you need
  const workoutExercises = useWorkoutStore((s) => s.workoutExercises);
  const resetWorkout = useWorkoutStore((s) => s.resetWorkout);
  const weightUnit = useWorkoutStore((s) => s.weightUnit);
  const setWeightUnit = useWorkoutStore((s) => s.setWeightUnit);
  const hasHydrated = useWorkoutStore((s) => s.hasHydrated);

  const router = useRouter();

  const { seconds, minutes, reset } = useStopwatch({ autoStart: true });

  // ✅ optional but recommended for web
  if (Platform.OS === "web" && !hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
        <Text className="mt-2 text-gray-600">Loading workout...</Text>
      </View>
    );
  }

<<<<<<< HEAD
=======
  const didResetRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (workoutExercises.length === 0 && !didResetRef.current) {
        didResetRef.current = true;
        reset();
      }

      return () => {
        didResetRef.current = false;
      };
    }, [workoutExercises.length])
  );


>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
  const getWorkoutDuration = () => {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
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

  const addExercise = () => {
    setShowExerciseSelection(true);
  }

  const deleteExercise = (id: string) => { };

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      {/* ✅ keep only ONE safe area spacer */}
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
                className={`px-3 py-1 rounded ${weightUnit === "lbs" ? "bg-blue-600" : ""}`}
              >
                <Text className={`text-sm font-medium ${weightUnit === "lbs" ? "text-white" : "text-gray-300"}`}>
                  lbs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setWeightUnit("kg")}
                className={`px-3 py-1 rounded ${weightUnit === "kg" ? "bg-blue-600" : ""}`}
              >
                <Text className={`text-sm font-medium ${weightUnit === "kg" ? "text-white" : "text-gray-300"}`}>
                  kg
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={cancelWorkout} className="bg-red-600 px-4 py-2 rounded-lg">
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

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <ScrollView className="flex-1 px-6 mt-4">
            {workoutExercises.map((exercise) => (
              <View key={exercise.id} className="mb-8">
<<<<<<< HEAD
                {/* Exercise Header */}
              </View>
            ))}
=======
                {/* Exercise header */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/exercise-details',
                      params: {
                        id: exercise.sanityId,
                      },
                    })
                  }
                  className="bg-blue-50 rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-gray-900 mb-2">
                        {exercise.name}
                      </Text>
                      <Text className="text-gray-600">
                        {exercise.sets.length} sets • {''}
                        {exercise.sets.filter((set) => set.isCompleted).length}
                        {''}
                        completed
                      </Text>
                    </View>
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)

                    {/* Delete Exercise Button */}
                    <TouchableOpacity
                      onPress={() => deleteExercise(exercise.id)}
                      className="w-10 h-10 rounded-xl items-center justify-center bg-red-500 ml-3">
                      <Ionicons name="trash" size={16} color='white' />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

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
                        className={`py-3 px-3 mb-2 rounded-lg border ${set.isCompleted
                            ? "bg-green-100 border-green-300"
                            : "bg-gray-50 border-gray-200"
                          }`}
                      >
                        {/* First row: sets numbers, reps, weight, completed button, delete button */}
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-700 font-medium w-8">
                            {setIndex + 1}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                  </View>
                  


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
