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
import Markdown from "react-native-markdown-display";
import { client } from "../../lib/sanity";
import type { Exercise } from "../../lib/sanity/types.js";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;


export default function ExerciseDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiGuidance, setAiGuidance] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

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

  const getAiGuidance = async () => {
    if (!exercise?.name) return;

    try {
      setAiLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName: exercise.name }),
      });

      if (!response.ok) throw new Error("Failed to fetch AI guidance");

      const data = await response.json();
      setAiGuidance(data.message);
    } catch (error) {
      console.error("Error fetching AI guidance", error);
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ Hero image source:
  // 1) prefer gifUrl (direct)
  // 2) fallback to backend proxy using exerciseId
  const heroUri = useMemo(() => {
    if (exercise?.gifUrl) return exercise.gifUrl;
    if (exercise?.exerciseId && BACKEND_URL) {
      return `${BACKEND_URL}/api/gifs/exercise/${exercise.exerciseId}`;
    }
    return undefined;
  }, [exercise?.gifUrl, exercise?.exerciseId]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header with close button */}
      <View className="absolute top-12 left-0 right-0 z-10 px-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
          activeOpacity={0.85}
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
              source={{ uri: heroUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
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

          {/* AI guidence */}
          {(aiGuidance || aiLoading) && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="fitness" size={24} color="#3882f6" />
                <Text className="text-xl font-semibold text-gray-800 ml-2">
                  AI Coach says...
                </Text>
              </View>

              {aiLoading ? (
                <View className="bg-gray-50 rounded-xl p-4 items-center">
                  <ActivityIndicator size="small" color="#3882f6" />
                  <Text className="text-gray-600 mt-2">
                    Getting personalized guidance...
                  </Text>
                </View>
              ) : (
                <View className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <Markdown
                    style={{
                      body: {
                        paddingBottom: 20,
                      },
                      heading2: {
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#1f2937",
                        marginTop: 12,
                        marginBottom: 6,
                      },
                      heading3: {
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#374151",
                        marginTop: 8,
                        marginBottom: 4,
                      },
                    }}
                  >
                    {aiGuidance}
                  </Markdown>
                </View>
              )}
            </View>
          )}

          {/* --------------- */}

          {/* Action Button */}
          <View className="mt-8 gap-2">
            {/* AI Coach button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center justify-center ${
                aiLoading
                  ? "bg-gray-400"
                  : aiGuidance
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              onPress={getAiGuidance}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Loading...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-bold text-lg text-center">
                  {aiGuidance
                    ? "Refresh AI Guidance"
                    : "Get AI Guidance on Form & Technique"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 rounded-xl py-4 items-center"
              onPress={() => router.back()}
            >
              <Text className="text-gray-800 font-bold text-lg">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
