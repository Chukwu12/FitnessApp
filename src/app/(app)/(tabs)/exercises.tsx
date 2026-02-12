import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useDeferredValue,
} from "react";
import {
  Text,
  SafeAreaView,
  FlatList,
  View,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ExerciseCard from "../components/ExerciseCard";
import { client } from "../../../lib/sanity";
import type { Exercise } from "../../../lib/sanity/types";
import { defineQuery } from "groq";

// ✅ Updated GROQ query (matches schema + modal)
export const exercisesQuery = defineQuery(`
  *[_type == "exercise" && isActive != false] 
  | order(name asc){
    _id,
    exerciseId,
    name,
    bodyPart,
    target,
    secondaryMuscles,
    equipment,
    category,
    difficulty,
    tags,
    instructions,
    gifUrl
  }
`);

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // -------------------
  // Fetch Exercises
  // -------------------
  const fetchExercises = useCallback(async () => {
    try {
      const data = await client.fetch(exercisesQuery);
      setExercises(data ?? []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  }, [fetchExercises]);

  // -------------------
  // Search Optimization
  // -------------------
  const deferredSearch = useDeferredValue(searchQuery);

  const filteredExercises = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return exercises;

    return exercises.filter((ex) => {
      const haystack = [
        ex.name,
        ex.difficulty,
        ex.bodyPart,
        ex.target,
        ex.equipment,
        ex.category,
        ...(ex.secondaryMuscles ?? []),
        ...(ex.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [deferredSearch, exercises]);

  // -------------------
  // Stable renderItem
  // -------------------
  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard
        item={item}
        onPress={() =>
          router.push({
            pathname: "/exercise-details",
            params: { id: item._id },
          })
        }
      />
    ),
    [router]
  );

  // -------------------
  // Loading State
  // -------------------
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-500">Loading exercises...</Text>
      </SafeAreaView>
    );
  }

  // -------------------
  // Main UI
  // -------------------
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header + Search */}
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Exercise Library
        </Text>
        <Text className="text-gray-500 mt-1">
          Discover and master new exercises
        </Text>

        <View className="flex-row items-center bg-gray-100 rounded-xl p-2 mt-3">
          <Ionicons name="search" size={20} color="#687280" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search exercises..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color="#687280"
              onPress={() => setSearchQuery("")}
            />
          )}
        </View>
      </View>

      {/* Exercises List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{
          gap: 12,
          paddingHorizontal: 16,
          marginTop: 16,
        }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3882F6"]}
            tintColor="#3882F6"
            title="Pull to refresh exercises"
            titleColor="#6B7280"
          />
        }
        initialNumToRender={10}
        windowSize={7}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View className="items-center p-8">
            <Ionicons name="fitness-outline" size={64} color="#9CA3AF" />
            <Text className="mt-2 text-lg font-semibold text-gray-900">
              {searchQuery ? "No exercises found" : "No exercises yet"}
            </Text>
            <Text className="text-gray-500 text-center mt-1">
              {searchQuery
                ? "Try adjusting your search"
                : "Your exercises will appear here"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
