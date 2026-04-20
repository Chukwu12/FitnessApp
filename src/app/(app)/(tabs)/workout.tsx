import React from "react";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

function Workout() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />

      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 🔹 HEADER */}
        <View className="pt-6 pb-6">
          <Text className="text-white text-3xl font-bold">
            Workout Hub
          </Text>
          <Text className="text-slate-400 mt-1">
            Train smarter. Stay consistent.
          </Text>
        </View>

        {/* 🔥 PRIMARY CARD */}
        <LinearGradient
          colors={["#22C55E", "#16A34A"]}
          className="rounded-3xl p-5 mb-5"
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-slate-950 text-sm font-semibold uppercase">
                Ready to Train
              </Text>

              <Text className="text-slate-950 text-3xl font-extrabold mt-2">
                Start Workout
              </Text>

              <Text className="text-slate-950 mt-2">
                Build strength & consistency
              </Text>
            </View>

            <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center">
              <Ionicons name="play" size={22} color="#020617" />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(app)/active-workout")}
            className="bg-slate-950 rounded-2xl py-4 items-center mt-5 active:scale-95"
          >
            <Text className="text-white font-semibold">
              Start Session
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ⚡ QUICK ACTIONS */}
        <View className="flex-row gap-3 mb-5">
          <QuickAction
            icon="barbell-outline"
            label="Exercises"
            onPress={() => router.push("/(tabs)/exercises")}
          />
          <QuickAction
            icon="time-outline"
            label="History"
            onPress={() => router.push("/(tabs)/history")}
          />
          <QuickAction
            icon="flash-outline"
            label="Quick Start"
            onPress={() => router.push("/(app)/active-workout")}
          />
        </View>

        {/* 🕘 LAST WORKOUT */}
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
          <Text className="text-white font-semibold mb-2">
            Last Workout
          </Text>

          <Text className="text-slate-400 text-sm">
            Upper Body • 45 min • Yesterday
          </Text>

          <TouchableOpacity className="mt-3">
            <Text className="text-green-500 font-semibold">
              View Details →
            </Text>
          </TouchableOpacity>
        </View>

        {/* 💡 TIP */}
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <Text className="text-white font-semibold mb-2">
            Tip of the Day
          </Text>
          <Text className="text-slate-400 text-sm">
            Consistency beats intensity. Show up daily.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 items-center active:scale-95"
    >
      <Ionicons name={icon} size={20} color="#22C55E" />
      <Text className="text-white text-sm mt-2">{label}</Text>
    </TouchableOpacity>
  );
}

export default Workout;