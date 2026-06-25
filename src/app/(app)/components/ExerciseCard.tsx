import React, { useMemo, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Exercise } from "@/lib/sanity/types";

interface ExerciseCardProps {
  item: Exercise;
  index?: number; // ✅ optional index for better key management in lists
  onPress: () => void;
  showChevron?: boolean;
  // ✅ optional delete support
  onDelete?: () => void;
  showDelete?: boolean;
  isSelected?: boolean;
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

const formatName = (name: string) =>
  name.replace(/\b\w/g, (char) => char.toUpperCase());

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

function ExerciseCardBase({
  item,
  onPress,
  showChevron = false,
  onDelete,
  showDelete = false,
  isSelected = false,
}: ExerciseCardProps) {
  const imageUri = useMemo(() => {
    // 1) Prefer backend proxy if exerciseId exists
    if (item.exerciseId && BACKEND_URL) {
      return `${BACKEND_URL}/api/gifs/exercise/${item.exerciseId}`;
    }

    // 2) Fallback to gifUrl from Sanity if available
    if (item.gifUrl) {
      return item.gifUrl;
    }

    // 3) Nothing available
    return undefined;
  }, [item.exerciseId, item.gifUrl, BACKEND_URL]);

  const imageSource = useMemo(
    () => (imageUri ? { uri: imageUri } : undefined),
    [imageUri]
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY]);

  return (
    <View className="flex-1 bg-slate-900 rounded-3xl mb-4 border border-slate-800 p-4 relative">
      {isSelected && (
        <View className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-green-500 items-center justify-center">
          <Ionicons name="checkmark" size={18} color="#020617" />
        </View>
      )}
      {/* ✅ Top row: pressable content + separate delete button */}
      <View className="flex-row items-start">
        <TouchableOpacity
          className="flex-1 active:scale-95"
          onPress={onPress}
          activeOpacity={0.8}
        >
          {imageSource ? (
            <View className="w-full h-[120px] rounded-2xl overflow-hidden mb-3 bg-slate-800/60 items-center justify-center">
              <Image
                source={imageSource}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
              />
            </View>
          ) : (
            <View className="h-[150px] w-full rounded-2xl bg-slate-800 mb-3 items-center justify-center">
              <Text className="text-slate-500 text-xs">No image</Text>
            </View>
          )}

          <Text
            className="text-lg font-semibold text-white mt-1"
            numberOfLines={2}
          >
            {formatName(item.name ?? "Exercise")}
          </Text>

          <Text className="text-slate-400 text-sm mt-1">
            {item.target ? formatName(item.target) : "Unknown"} •{" "}
            {item.equipment ? formatName(item.equipment) : "Bodyweight"}
          </Text>

          <View className="flex-row items-center mt-2">
            <View
              className={`px-3 py-1 rounded-full ${getDifficultyColor(
                item.difficulty
              )}`}
            >
              <Text className="text-xs text-white font-semibold">
                {normalizeDifficulty(item.difficulty)}
              </Text>
            </View>

            {showChevron && (
              <Text className="ml-auto text-slate-500 text-lg">›</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* ✅ Delete button is NOT nested inside the pressable content */}
        {showDelete ? (
          <TouchableOpacity
            onPress={onDelete}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="ml-3 w-10 h-10 rounded-xl items-center justify-center bg-slate-800 border border-slate-700 active:scale-95"
          >
            <Text className="text-slate-400 text-base">🗑️</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const ExerciseCard = React.memo(ExerciseCardBase);
export default ExerciseCard;
