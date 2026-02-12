<<<<<<< HEAD
=======
import React, { useEffect, useMemo, useState } from "react";
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
import {
  View,
  Text,
  Modal,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
<<<<<<< HEAD
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { useWorkoutStore } from "../../../store/workout-store";
// import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ExerciseCard from "./ExerciseCard";
import { client } from "@/lib/sanity/client";
import { defineQuery } from "groq";
=======
  ActivityIndicator,
} from "react-native";
import { useRouter } from 'expo-router'
import { useWorkoutStore } from '@/store/workout-store'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ExerciseCard from './ExerciseCard';
import { client } from '@/lib/sanity';
import type { Exercise } from "@/lib/sanity/types";
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)

// ✅ Query to fetch exercises from Sanity
export const exercisesQuery = defineQuery(`*[_type == "exercise"]{
  _id,
  exerciseId,
  name,
  bodyPart,
  target,
  equipment,
  difficulty,
  tags,
  instructions,
  gifUrl
}`);

type Exercise = {
  _id: string;
  name: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  difficulty?: string;
  exerciseId?: string;
  gifUrl?: string;
};

interface ExerciseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}


// ✅ Fetch fields that match your schema + what your UI needs
const exercisesQuery = `*[_type == "exercise" && isActive != false] | order(name asc){
  _id,
  exerciseId,
  name,
  bodyPart,
  target,
  secondaryMuscles,
  equipment,
  category,
  difficulty,
  tags
}`;

export default function ExerciseSelectionModal({
  visible,
  onClose,
}: ExerciseSelectionModalProps) {
<<<<<<< HEAD
  const { addExerciseToWorkout } = useWorkoutStore();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const result = await client.fetch<Exercise[]>(exercisesQuery);
      setExercises(result || []);
    } catch (error) {
      console.error("Error fetching exercises", error);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exercises;

    return exercises.filter((e) => {
      return (
        e.name?.toLowerCase().includes(q) ||
        e.bodyPart?.toLowerCase().includes(q) ||
        e.target?.toLowerCase().includes(q) ||
        e.equipment?.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, exercises]);

  //Directly add exercise to workout
  const handleExercisePress = (exercise: Exercise) => {
    addExerciseToWorkout({ name: exercise.name, sanityId: exercise._id });
    onClose();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  };
=======
    const router = useRouter();
    const addExerciseToWorkout = useWorkoutStore((s) => s.addExerciseToWorkout);
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exercises;

    return exercises.filter((e) => {
      const haystack = [
        e.name,
        e.difficulty,
        e.bodyPart,
        e.target,
        e.equipment,
        e.category,
        ...(e.secondaryMuscles ?? []),
        ...(e.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [exercises, searchQuery]);

    const fetchExercises = async () => {
    try {
      setLoading(true);
      const data = await client.fetch<Exercise[]>(exercisesQuery);
      setExercises(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

   // ✅ Load when the modal opens
  useEffect(() => {
    if (!visible) return;
    fetchExercises();
    setSearchQuery("");
  }, [visible]);


    
  const handleExercisePress = (exercise: Exercise) => {
    addExerciseToWorkout({
      name: exercise.name ?? "Exercise",
      sanityId: exercise._id,
    });
    onClose();
  };

    const onRefresh = async () => {
      setRefreshing(true)
      await fetchExercises();
      setRefreshing(false);
    };

 return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
<<<<<<< HEAD
        <View className="bg-white px-4 pb-6 shadow-sm border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-gray-800">
              Add Exercise
            </Text>
=======
        <View className="bg-white px-4 pt-4 pb-6 shadow-sm border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-gray-800">Add Exercise</Text>

>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 mb-4">
            Tap any exercise to add it to your workout
          </Text>

<<<<<<< HEAD
          {/* SearchBar */}
=======
          {/* Search Bar */}
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-800"
<<<<<<< HEAD
              placeholder="Search exercises..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
=======
              placeholder="Search name, muscle, equipment..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

<<<<<<< HEAD
        {/* Exercise List */}
        <FlatList
          data={filteredExercises}
=======
        {/* List */}
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item._id}
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
          renderItem={({ item }) => (
            <ExerciseCard
              item={item}
              onPress={() => handleExercisePress(item)}
              showChevron={false}
            />
          )}
<<<<<<< HEAD
          keyExtractor={(item) => item._id}
=======
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 16,
<<<<<<< HEAD
            flexGrow: filteredExercises.length === 0 ? 1 : undefined,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]} //Android
              tintColor="#3B82F6" //IOS
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="fitness-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-400 mt-4">
                {loading
                  ? "Loading exercises..."
                  : searchQuery
                  ? "No exercises found"
                  : "No exercises yet"}
              </Text>
              <Text className="text-sm text-gray-400 mt-2">
                {searchQuery ? "Try adjusting your search" : "Pull to refresh"}
              </Text>
=======
            flexGrow: filteredExercises.length === 0 ? 1 : 0,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              {loading ? (
                <>
                  <ActivityIndicator />
                  <Text className="text-lg font-semibold text-gray-500 mt-4">
                    Loading exercises...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="fitness-outline" size={64} color="#D1D5DB" />
                  <Text className="text-lg font-semibold text-gray-400 mt-4">
                    {searchQuery ? "No exercises found" : "No exercises available"}
                  </Text>
                  <Text className="text-sm text-gray-400 mt-2">
                    {searchQuery ? "Try a different search" : "Pull to refresh"}
                  </Text>
                </>
              )}
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 9327ec6 (Fix Metro import.meta crash (SDK 53), update metro config resolver, stabilize Expo Router auth redirects, refactor ExerciseSelectionModal to match Sanity schema, improve search + refresh logic, fix map() rendering bug in ActiveWorkout sets, and general UI cleanup)
