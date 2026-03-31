import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useWorkoutStore } from "@/store/workout-store";
import ExerciseCard from "./ExerciseCard";

// ✅ Use the Sanity client that works in your project.
// If your project uses "@/lib/sanity/client" instead, swap this import.
import { client } from "@/lib/sanity";

// ✅ Use your generated Sanity type if available
import type { Exercise } from "@/lib/sanity/types";

interface ExerciseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

// ✅ Fetch fields that match your schema + what UI/search needs
const exercisesQuery = `*[_type == "exercise" && isActive != false] | order(name asc){
  _id,
  exerciseId,
  name,
  gifUrl,
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
  const addExerciseToWorkout = useWorkoutStore((s) => s.addExerciseToWorkout);

  // State Selections
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );

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

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exercises;

    return exercises.filter((e: any) => {
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

  const handleExercisePress = (exercise: any) => {
    // ✅ show instant visual feedback
    setSelectedExerciseId(exercise?._id ?? null);

    addExerciseToWorkout({
      name: exercise?.name ?? "Exercise",
      sanityId: exercise?._id,
    });

    // ✅ close modal after a very short delay so user sees the feedback
    setTimeout(() => {
      setSelectedExerciseId(null);
      onClose();
    }, 250);
  };

  const onRefresh = async () => {
    setRefreshing(true);
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
      <SafeAreaView className="flex-1 bg-slate-950">
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View className="bg-slate-950 px-4 pt-4 pb-5 border-b border-slate-800">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-white">
              Exercise Library
            </Text>

            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-400 mb-4">
            Search and add exercises to your workout
          </Text>

          {/* Search Bar */}
          <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              className="flex-1 ml-3 text-white"
              placeholder="Search name, muscle, equipment..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filteredExercises}
          keyExtractor={(item: any) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          renderItem={({ item }: any) => (
            <View style={{ flex: 1 }}>
              <ExerciseCard
                item={item}
                onPress={() => handleExercisePress(item)}
                showChevron={false}
                isSelected={selectedExerciseId === item._id}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 32,
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
                  <Text className="text-lg font-semibold text-slate-300 mt-4">
                    Loading exercises...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="fitness-outline" size={64} color="#D1D5DB" />
                  <Text className="text-lg font-semibold text-gray-400 mt-4">
                    {searchQuery
                      ? "No exercises found"
                      : "No exercises available"}
                  </Text>
                  <Text className="text-sm text-slate-500 mt-2">
                    {searchQuery ? "Try a different search" : "Pull to refresh"}
                  </Text>
                </>
              )}
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
