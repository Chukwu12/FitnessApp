 import React from "react";
import { Platform, ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function Layout() {
  const isWeb = Platform.OS === "web";
  const { isLoaded, isSignedIn } = useAuth();

  // ✅ Fix your className typo
  if (!isWeb && !isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // ✅ WEB (CodeSandbox / Metro Web): no guards, let everything render
  if (isWeb) {
    return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="active-workout" options={{ headerShown: false }} />
        <Stack.Screen
          name="exercise-details"
          options={{
            headerShown: false,
            presentation: "modal",
            gestureEnabled: true,
            animationTypeForReplace: "push",
          }}
        />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // ✅ NATIVE: keep guards (but coerce boolean for TS)
  const signedIn = Boolean(isSignedIn);

  return (
    <Stack>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="active-workout" options={{ headerShown: false }} />
        <Stack.Screen
          name="exercise-details"
          options={{
            headerShown: false,
            presentation: "modal",
            gestureEnabled: true,
            animationTypeForReplace: "push",
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
