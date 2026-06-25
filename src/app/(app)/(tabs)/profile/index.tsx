import { useAuth, useClerk } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { calculateStats } from "@/lib/stats";
import { evaluateAchievements } from "@/lib/achievements";
import { client } from "@/lib/sanity/client";
import { defineQuery } from "groq";
import { useEffect, useState, useMemo } from "react";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

export default function ProfilePage() {
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const userName = "Okey"; // later replace with Clerk user

  // WORKOUTS STATE
  const [workouts, setWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  const getWorkoutsQuery = defineQuery(`
*[_type == "workout" && userId == $userId]{
  _id,
  date,
  duration
}
`);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      try {
        const data = await client.fetch(getWorkoutsQuery, { userId });
        setWorkouts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingWorkouts(false);
      }
    };

    fetch();
  }, [userId]);


  // MOCK WORKOUTS (REPLACE WITH REAL DATA FETCHED FROM SANITY)
  const { totalWorkouts, streak } = useMemo(
    () => calculateStats(workouts),
    [workouts]
  );

  const achievements = useMemo(
    () => evaluateAchievements(totalWorkouts, streak),
    [totalWorkouts, streak]
  );

  const performSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      Alert.alert("Error", "Sign out failed. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      if (globalThis.confirm("Are you sure?")) performSignOut();
      return;
    }

    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: performSignOut },
    ]);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-slate-300 mt-4">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <Text className="text-white text-lg">You are signed out</Text>
        <TouchableOpacity
          onPress={() => router.replace("/sign-in")}
          className="mt-4 bg-green-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-black font-bold">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

 return (
  <SafeAreaView className="flex-1 bg-slate-950">
    <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>

      {/* HEADER */}
      <View className="pt-6 pb-4">
        <Text className="text-2xl font-bold text-white">Profile</Text>
        <Text className="text-slate-400 mt-1">
          Your fitness identity
        </Text>
      </View>

      {/* HERO */}
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 items-center mb-6">
        <View className="h-16 w-16 rounded-full bg-green-500/20 items-center justify-center mb-3">
          <Ionicons name="person" size={28} color="#22C55E" />
        </View>

        <Text className="text-white text-xl font-bold">
          {userName}
        </Text>

        <Text className="text-slate-400 mt-1">
          Consistency builds greatness
        </Text>
      </View>

      {/* 🏆 ACHIEVEMENTS */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-3">
          Achievements
        </Text>

        {/* 🔄 Loading State */}
        {loadingWorkouts ? (
          <View className="items-center py-6">
            <ActivityIndicator color="#22C55E" />
            <Text className="text-slate-400 mt-2 text-sm">
              Loading achievements...
            </Text>
          </View>
        ) : achievements.length === 0 ? (
          // 💤 Empty State
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 items-center">
            <Ionicons name="trophy-outline" size={28} color="#64748B" />
            <Text className="text-slate-400 mt-3 text-center">
              Complete workouts to unlock achievements 💪
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {achievements.map((a) => {
              const progressPercent =
                a.requirement > 0
                  ? Math.min((a.progress / a.requirement) * 100, 100)
                  : 0;

              return (
                <View
                  key={a.id}
                  className={`w-[48%] p-4 rounded-2xl border ${
                    a.unlocked
                      ? "bg-green-500/10 border-green-500/40"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  {/* ICON */}
                  <Ionicons
                    name={a.icon as any}
                    size={22}
                    color={a.unlocked ? "#22C55E" : "#64748B"}
                  />

                  {/* TITLE */}
                  <Text className="text-white font-semibold mt-2">
                    {a.title}
                  </Text>

                  {/* DESCRIPTION */}
                  <Text className="text-slate-400 text-xs mt-1">
                    {a.description}
                  </Text>

                  {/* PROGRESS */}
                  {!a.unlocked && (
                    <View className="mt-2">
                      <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <View
                          style={{ width: `${progressPercent}%` }}
                          className="h-2 bg-green-500"
                        />
                      </View>

                      <Text className="text-slate-500 text-xs mt-1">
                        {a.progress}/{a.requirement}
                      </Text>
                    </View>
                  )}

                  {/* ✅ UNLOCKED LABEL */}
                  {a.unlocked && (
                    <Text className="text-green-400 text-xs mt-2 font-semibold">
                      Unlocked
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ACCOUNT */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
        <Text className="text-white font-semibold mb-3">
          Account
        </Text>

        <TouchableOpacity
          onPress={handleSignOut}
          disabled={isSigningOut}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 active:scale-95"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-400 font-semibold ml-2">
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

    </ScrollView>
  </SafeAreaView>
);
}