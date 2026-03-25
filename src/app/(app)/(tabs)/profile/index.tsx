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
    <SafeAreaView className="flex-1">
      <Text>Profile</Text>

      <View className="px-6 mb-8">
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-600 rounded-2xl p-4"
          disabled={isSigningOut}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
