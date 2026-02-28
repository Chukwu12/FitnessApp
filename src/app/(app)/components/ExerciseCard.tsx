import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
// import type { Exercise } from "@/lib/sanity/types";

type Exercise = {
  _id: string;
  name: string;
  difficulty?: string;
  exerciseId?: string;
};

interface ExerciseCardProps {
  item: Exercise;
  onPress: () => void;
  showChevron?: boolean;
  // ✅ optional delete support
  onDelete?: () => void;
  showDelete?: boolean;

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


const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

function ExerciseCardBase({
  item,
  onPress,
  showChevron = false,
  onDelete,
  showDelete = false,
}: ExerciseCardProps) {
  const gifUri = useMemo(() => {
    if (!item.exerciseId || !BACKEND_URL) return undefined;
    return `${BACKEND_URL}/api/gifs/exercise/${item.exerciseId}`;
  }, [item.exerciseId]);

   const imageSource = useMemo(() => (gifUri ? { uri: gifUri } : undefined), [gifUri]);


  
   return (
    <View className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 p-4">
      {/* ✅ Top row: pressable content + separate delete button */}
      <View className="flex-row items-start">
        <TouchableOpacity
          className="flex-1"
          onPress={onPress}
          activeOpacity={0.8}
        >
          {imageSource ? (
            <Image
              source={imageSource}
              style={{ width: "100%", height: 140, borderRadius: 16, marginBottom: 8 }}
              contentFit="cover"
              cachePolicy="disk"
              transition={0}
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
            <View className={`px-2 py-1 rounded-full ${getDifficultyColor(item.difficulty)}`}>
              <Text className="text-xs text-white font-medium">
                {normalizeDifficulty(item.difficulty)}
              </Text>
            </View>

            {showChevron ? <Text className="ml-auto text-gray-400">{">"}</Text> : null}
          </View>
        </TouchableOpacity>

        {/* ✅ Delete button is NOT nested inside the pressable content */}
        {showDelete ? (
          <TouchableOpacity
            onPress={onDelete}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="ml-3 w-10 h-10 rounded-xl items-center justify-center bg-red-500"
          >
            <Text className="text-white font-bold">🗑️</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const ExerciseCard = React.memo(ExerciseCardBase);
export default ExerciseCard;