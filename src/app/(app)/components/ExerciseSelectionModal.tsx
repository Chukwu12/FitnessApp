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

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

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
    addExerciseToWorkout({
      name: exercise?.name ?? "Exercise",
      sanityId: exercise?._id,
    });
    onClose();
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
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="bg-white px-4 pt-4 pb-6 shadow-sm border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-gray-800">Add Exercise</Text>

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

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-800"
              placeholder="Search name, muscle, equipment..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filteredExercises}
          keyExtractor={(item: any) => item._id}
          renderItem={({ item }: any) => (
            <ExerciseCard
              item={item}
              onPress={() => handleExercisePress(item)}
              showChevron={false}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 16,
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
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
