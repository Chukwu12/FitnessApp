import {
  View,
  Text,
  Modal,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { useWorkoutStore } from "../../../store/workout-store";
// import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ExerciseCard from "./ExerciseCard";
import { client } from "@/lib/sanity/client";
import { defineQuery } from "groq";

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

export default function ExerciseSelectionModal({
  visible,
  onClose,
}: ExerciseSelectionModalProps) {
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
        <View className="bg-white px-4 pb-6 shadow-sm border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-gray-800">
              Add Exercise
            </Text>
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

          {/* SearchBar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-800"
              placeholder="Search exercises..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Exercise List */}
        <FlatList
          data={filteredExercises}
          renderItem={({ item }) => (
            <ExerciseCard
              item={item}
              onPress={() => handleExercisePress(item)}
              showChevron={false}
            />
          )}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 16,
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
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
