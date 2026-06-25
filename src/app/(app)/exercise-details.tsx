import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { client } from "../../lib/sanity";
import type { Exercise } from "../../lib/sanity/types.js";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";


export default function ExerciseDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  // State for exercise details
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setExercise(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        // ✅ Fetch the exact exercise doc by _id
        const data = await client.fetch(
          `*[_type == "exercise" && _id == $id][0]{
            _id,
            exerciseId,
            name,
            bodyPart,
            target,
            secondaryMuscles,
            equipment,
            category,
            instructions,
            gifUrl,
            difficulty,
            tags,
            description,
            videoUrl
          }`,
          { id }
        );

        if (!cancelled) setExercise(data ?? null);
      } catch (e) {
        if (!cancelled) setExercise(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ✅ Hero image source:
  const heroUri = useMemo(() => {
    if (exercise?.exerciseId && BACKEND_URL) {
      return `${BACKEND_URL}/api/gifs/exercise/${exercise.exerciseId}`;
    }
    // optional: fallback only if it's NOT the csb url
    if (exercise?.gifUrl && !exercise.gifUrl.includes(".csb.app")) {
      return exercise.gifUrl;
    }
    return undefined;
  }, [exercise?.exerciseId, exercise?.gifUrl, BACKEND_URL]);


  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header with close button */}
      <View className="absolute top-12 left-0 right-0 z-10 px-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-black/30 rounded-full items-center justify-center active:scale-95"
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="h-80 bg-black relative">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator />
            </View>
          ) : heroUri ? (
            <Image
              source={heroUri ? { uri: heroUri } : undefined}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="disk"
              transition={0}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="fitness" size={80} color="white" />
              <Text className="text-white mt-2">No image</Text>
            </View>
          )}

          {/* Overlay */}
          <View className="absolute bottom-0 left-0 right-0 h-24 bg-black/40" />
        </View>

        {/* Content */}
        <View className="px-5 py-6">
          <Text className="text-2xl font-bold text-gray-900">
            {exercise?.name ?? "Exercise"}
          </Text>

          <Text className="text-gray-600 mt-2">
            {exercise?.target ? `${exercise.target} • ` : ""}
            {exercise?.equipment ?? ""}
          </Text>

          {/* Chips */}
          <View className="flex-row flex-wrap mt-4">
            {exercise?.bodyPart ? (
              <View className="mr-2 mb-2 px-3 py-1 rounded-full bg-gray-100">
                <Text className="text-gray-800 text-xs">
                  {exercise.bodyPart}
                </Text>
              </View>
            ) : null}

            {exercise?.category ? (
              <View className="mr-2 mb-2 px-3 py-1 rounded-full bg-gray-100">
                <Text className="text-gray-800 text-xs">
                  {exercise.category}
                </Text>
              </View>
            ) : null}

            {exercise?.difficulty ? (
              <View className="mr-2 mb-2 px-3 py-1 rounded-full bg-gray-100">
                <Text className="text-gray-800 text-xs">
                  {exercise.difficulty}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {exercise?.description ? (
            <View className="mt-5">
              <Text className="text-lg font-semibold text-gray-900">
                Description
              </Text>
              <Text className="text-gray-700 mt-2 leading-6">
                {exercise.description}
              </Text>
            </View>
          ) : null}

          {/* Instructions */}
          {exercise?.instructions?.length ? (
            <View className="mt-6">
              <Text className="text-lg font-semibold text-gray-900">
                Instructions
              </Text>
              <View className="mt-3">
                {exercise.instructions.map((step: string, idx: number) => (
                  <View key={`${idx}-${step}`} className="flex-row mb-3">
                    <Text className="text-gray-900 font-bold mr-2">
                      {idx + 1}.
                    </Text>
                    <Text className="text-gray-700 flex-1 leading-6">
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Secondary muscles */}
          {exercise?.secondaryMuscles?.length ? (
            <View className="mt-6">
              <Text className="text-lg font-semibold text-gray-900">
                Secondary Muscles
              </Text>
              <Text className="text-gray-700 mt-2">
                {exercise.secondaryMuscles.join(", ")}
              </Text>
            </View>
          ) : null}

          {/* --------------- */}

          {/* Action Button */}
          <View className="mt-8 gap-2">
            <TouchableOpacity
              className="bg-gray-200 rounded-xl py-4 items-center active:scale-95"
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text className="text-gray-800 font-bold text-lg">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
