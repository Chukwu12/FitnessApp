import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";

// ⚠️ NOTE: This top LinearGradient is currently unused — you should REMOVE it
// because it’s not wrapped around any component.
// We'll properly use it inside TodayWorkoutCard later.

export default function Page() {
  // 👤 USER DATA (replace with real data later)
  const userName = "Okey";

  // 🏋️ TODAY'S WORKOUT DATA
  const todayWorkout = {
    title: "Full Body Strength",
    duration: "45 min",
    exercises: 6,
  };

  // ▶️ CHECK IF USER HAS ACTIVE WORKOUT
  const hasActiveWorkout = true;

  // 📊 STATS DATA (Section you're currently working on)
  const stats = [
  { label: "Workouts", value: "12", icon: "bars" as const },
  { label: "Minutes", value: "320", icon: "clockcircleo" as const },
  { label: "Streak", value: "5 days", icon: "star" as const },
];

  // 🕘 RECENT ACTIVITY DATA
  const recentActivity = [
    { name: "Upper Body Blast", date: "Yesterday", duration: "42 min" },
    { name: "Leg Day", date: "Mar 23", duration: "50 min" },
    { name: "Core & Cardio", date: "Mar 21", duration: "30 min" },
  ];

  return (
    // 🧱 MAIN SCREEN CONTAINER
    <SafeAreaView className="flex-1 bg-slate-950">

      {/* 📜 SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="px-4"
      >
        {/* 🔹 HEADER / GREETING */}
        <HomeHeader userName={userName} />

        {/* 🔥 TODAY'S WORKOUT CARD */}
        <TodayWorkoutCard workout={todayWorkout} />

        {/* 📊 STATS SECTION (YOU ARE HERE) */}
        <QuickStatsRow stats={stats} />

        {/* ▶️ CONTINUE / START WORKOUT */}
        <ContinueWorkoutCard hasActiveWorkout={hasActiveWorkout} />

        {/* 🕘 RECENT ACTIVITY */}
        <RecentActivitySection items={recentActivity} />
      </ScrollView>
    </SafeAreaView>
  );
}

//
// 🔹 HEADER COMPONENT
//
function HomeHeader({ userName }: { userName: string }) {
  return (
    <View className="flex-row items-center justify-between pt-4 pb-6">
      <View>
        {/* 👋 GREETING TEXT */}
        <Text className="text-slate-400 text-base">Good Morning 👋</Text>

        {/* 👤 USER NAME */}
        <Text className="text-white text-3xl font-bold mt-1">{userName}</Text>

        {/* 💬 SUBTEXT */}
        <Text className="text-slate-500 text-sm mt-1">
          Ready to build consistency today?
        </Text>
      </View>

      {/* 👤 PROFILE ICON */}
      <View className="h-12 w-12 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
        <AntDesign name="user" size={20} color="#F8FAFC" />
      </View>
    </View>
  );
}

//
// 🔥 TODAY WORKOUT CARD (MAIN FEATURE)
//
//
// 🔥 TODAY WORKOUT CARD (UPGRADED WITH GRADIENT)
//
function TodayWorkoutCard({
  workout,
}: {
  workout: { title: string; duration: string; exercises: number };
}) {
  return (
    // GRADIENT CARD BACKGROUND
    <LinearGradient
      colors={["#22C55E", "#16A34A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-3xl p-5 mb-5"
    >
      {/* 🔝 TOP ROW */}
      <View className="flex-row items-start justify-between">
        {/* 📄 LEFT SIDE CONTENT */}
        <View className="flex-1 pr-4">
          {/* 🏷️ SMALL LABEL */}
          <Text className="text-slate-950 text-sm font-semibold uppercase tracking-wide">
            Today’s Workout
          </Text>

          {/* 💪 WORKOUT TITLE */}
          <Text className="text-slate-950 text-3xl font-extrabold mt-2">
            {workout.title}
          </Text>

          {/* ⏱️ WORKOUT META INFO */}
          <View className="flex-row items-center mt-3">
            {/* DURATION */}
            <View className="flex-row items-center mr-4">
              <AntDesign name="clockcircleo" size={14} color="#020617" />
              <Text className="text-slate-950 ml-2 font-medium">
                {workout.duration}
              </Text>
            </View>

            {/* EXERCISE COUNT */}
            <View className="flex-row items-center">
              <AntDesign name="book" size={14} color="#020617" />
              <Text className="text-slate-950 ml-2 font-medium">
                {workout.exercises} exercises
              </Text>
            </View>
          </View>
        </View>

        {/* ▶️ PLAY ICON BOX */}
        <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center border border-white/20">
          <AntDesign name="play" size={22} color="#020617" />
        </View>
      </View>

      {/* ▶️ START BUTTON */}
      <TouchableOpacity className="bg-slate-950 rounded-2xl py-4 items-center mt-5 active:opacity-90">
        <Text className="text-white font-semibold text-base">
          Start Workout
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

//
// 📊 STATS ROW
//
function QuickStatsRow({
  stats,
}: {
  stats: {
    label: string;
    value: string;
    icon: keyof typeof AntDesign.glyphMap;
  }[];
}) {
  return (
    <View className="mb-5">

      {/* 🏷️ SECTION TITLE */}
      <Text className="text-white text-xl font-bold mb-3">Your Progress</Text>

      {/* 📦 STATS CONTAINER */}
      <View className="flex-row justify-between gap-3">

        {/* 🔁 LOOP THROUGH STATS */}
        {stats.map((stat) => (
          <View
            key={stat.label}

            // 🎨 EACH STAT CARD
            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl p-4 active:scale-95"
          >
            {/* 📊 ICON */}
            <AntDesign name={stat.icon} size={18} color="#22C55E" />

            {/* 🔢 VALUE */}
            <Text className="text-white text-lg font-bold mt-3">
              {stat.value}
            </Text>

            {/* 🏷️ LABEL */}
            <Text className="text-slate-400 text-sm mt-1">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

//
// ▶️ CONTINUE / START WORKOUT CARD
//
function ContinueWorkoutCard({ hasActiveWorkout }: { hasActiveWorkout: boolean }) {
  return (
    // 🎨 MAIN CARD CONTAINER
    <View className="bg-slate-900 border border-slate-700 rounded-3xl p-5 mb-5">
      {/* 🔝 TOP ROW */}
      <View className="flex-row items-start justify-between">
        {/* 📄 LEFT SIDE CONTENT */}
        <View className="flex-1 pr-4">
          {/* 🏷️ TITLE */}
          <Text className="text-white text-xl font-bold">
            {hasActiveWorkout ? "Continue Workout" : "Start New Workout"}
          </Text>

          {/* 💬 DESCRIPTION */}
          <Text className="text-slate-400 mt-2 leading-6">
            {hasActiveWorkout
              ? "You have an active session in progress. Pick up where you left off."
              : "Create a new training session and keep your momentum going."}
          </Text>
        </View>

        {/* ➡️ ACTION ICON BOX */}
        <View className="h-12 w-12 rounded-2xl bg-slate-800 border border-slate-700 items-center justify-center">
          <AntDesign
            name={hasActiveWorkout ? "arrowright" : "plus"}
            size={20}
            color="#22C55E"
          />
        </View>
      </View>

      {/* 📈 PROGRESS BAR */}
      {hasActiveWorkout && (
        <View className="mt-5">
          {/* TRACK */}
          <View className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            {/* FILL */}
            <View
              style={{ width: "66%" }}
              className="h-2 bg-green-500 rounded-full"
            />
          </View>

          {/* PROGRESS LABEL */}
          <Text className="text-slate-500 text-xs mt-2">
            Workout progress: 66%
          </Text>
        </View>
      )}

      {/* ▶️ PRIMARY BUTTON */}
      <TouchableOpacity className="bg-green-500 rounded-2xl py-4 items-center mt-5 active:opacity-90">
        <Text className="text-slate-950 font-bold text-base">
          {hasActiveWorkout ? "Resume Session" : "Create Workout"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

//
// 🕘 RECENT ACTIVITY SECTION
//
function RecentActivitySection({
  items,
}: {
  items: { name: string; date: string; duration: string }[];
}) {
  return (
    <View className="mb-6">

      {/* 🔝 HEADER */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-xl font-bold">
          Recent Activity
        </Text>

        <Text className="text-green-500 font-semibold text-sm">
          See all
        </Text>
      </View>

      {/* 📋 LIST */}
      <View className="gap-3">
        {items.map((item) => (
          <View
            key={`${item.name}-${item.date}`}

            // 🎨 CARD CONTAINER
            className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex-row items-center justify-between active:opacity-90"
          >
            {/* LEFT SIDE */}
            <View className="flex-row items-center flex-1 pr-3">

              {/* 📅 ICON BOX */}
              <View className="h-12 w-12 rounded-2xl bg-slate-700 items-center justify-center mr-3">
                <AntDesign name="calendar" size={18} color="#38BDF8" />
              </View>

              {/* TEXT CONTENT */}
              <View className="flex-1">
                {/* WORKOUT NAME */}
                <Text className="text-white font-semibold text-base">
                  {item.name}
                </Text>

                {/* META INFO */}
                <Text className="text-slate-400 text-sm mt-1">
                  {item.date} • {item.duration}
                </Text>
              </View>
            </View>

            {/* ➡️ RIGHT ARROW */}
            <AntDesign name="right" size={16} color="#64748B" />
          </View>
        ))}
      </View>
    </View>
  );
}