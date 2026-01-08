import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import type { Exercise } from "../../../lib/sanity/types";

interface ExerciseCardProps {
  item: Exercise;
  onPress: () => void;
  showChevron?: boolean;
}

const normalizeDifficulty = (difficulty?: string) => {
  if (!difficulty) return "Unknown";
  const lower = difficulty.toLowerCase();
  if (lower === "beginner") return "Beginner";
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Unknown";
};

const getDifficultyColor = (difficulty?: string) => {
  switch (normalizeDifficulty(difficulty)) {
    case "Beginner":
      return "bg-green-500";
    case "Intermediate":
      return "bg-yellow-500";
    case "Advanced":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
};

// ✅ remove any trailing slash so we never get `//api/...`
const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL_CODESPACE).replace(
  /\/$/,
  ""
);

export default function ExerciseCard({
  item,
  onPress,
  showChevron = false,
}: ExerciseCardProps) {
  const gifUri =
    item.exerciseId && BACKEND_URL
      ? `${BACKEND_URL}/api/gifs/exercise/${item.exerciseId}`
      : undefined;

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 p-4 flex-1"
      onPress={onPress}
      activeOpacity={0.8}
    >
      {gifUri ? (
        <Image
          source={{ uri: gifUri }}
          style={{
            width: "100%",
            height: 140,
            borderRadius: 16,
            marginBottom: 8,
          }}
          contentFit="cover"
        />
      ) : (
        <View className="h-[140px] w-full rounded-2xl bg-gray-200 mb-2 items-center justify-center">
          <Text className="text-gray-500 text-xs">No image</Text>
        </View>
      )}

      <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
        {item.name}
      </Text>

      <View className="flex-row items-center mt-2">
        <View
          className={`px-2 py-1 rounded-full ${getDifficultyColor(
            item.difficulty
          )}`}
        >
          <Text className="text-xs text-white font-medium">
            {normalizeDifficulty(item.difficulty)}
          </Text>
        </View>

        {showChevron ? (
          <Text className="ml-auto text-gray-400">{">"}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
