import { useAuth, useClerk } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function ProfilePage() {
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const performSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      console.error("Sign out failed:", error);
      Alert.alert("Error", "Sign out failed. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  };

  return (
  <SafeAreaView className="flex-1 bg-slate-950">

    {/* HEADER */}
    <View className="px-6 pt-6 pb-4 border-b border-slate-800">
      <Text className="text-2xl font-bold text-white">
        Profile
      </Text>
      <Text className="text-slate-400 mt-1">
        Manage your account & activity
      </Text>
    </View>

    <View className="flex-1 px-6 pt-6">

      {/* USER CARD */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-bold">
              Welcome Back 👋
            </Text>

            <Text className="text-slate-400 mt-1">
              Ready for your next workout?
            </Text>
          </View>

          <View className="bg-green-500/20 p-3 rounded-full">
            <Ionicons name="person" size={22} color="#22C55E" />
          </View>
        </View>
      </View>

      {/* STATS PLACEHOLDER (we’ll connect later to Sanity/history) */}
      <View className="flex-row gap-3 mb-6">

        <View className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <Text className="text-slate-400 text-xs">Workouts</Text>
          <Text className="text-white text-xl font-bold mt-1">
            --
          </Text>
        </View>

        <View className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <Text className="text-slate-400 text-xs">Streak</Text>
          <Text className="text-white text-xl font-bold mt-1">
            --
          </Text>
        </View>

      </View>

      {/* ACTION CARD */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
        <Text className="text-white font-semibold mb-3">
          Account
        </Text>

        <TouchableOpacity
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.8}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 active:scale-95"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-400 font-semibold text-lg ml-2">
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

    </View>
  </SafeAreaView>
);
}
