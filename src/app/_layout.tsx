import "../global.css";
import { ClerkProvider } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import "@/lib/sanity/typegen";

export default function Layout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-xl font-semibold text-gray-900 mb-3">
          Missing Clerk publishable key
        </Text>
        <Text className="text-center text-gray-600">
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your root .env file and restart Expo.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <>
        <Slot />

        {/* ✅ TOAST PROVIDER */}
        <Toast
          position="top"
          topOffset={60}
          visibilityTime={2500}
          config={{
            success: (props) => (
              <View className="bg-slate-900 px-4 py-3 rounded-xl border border-green-500">
                <Text className="text-green-400 font-semibold">
                  {props.text1}
                </Text>
                {props.text2 && (
                  <Text className="text-slate-300 text-sm">
                    {props.text2}
                  </Text>
                )}
              </View>
            ),
            error: (props) => (
              <View className="bg-slate-900 px-4 py-3 rounded-xl border border-red-500">
                <Text className="text-red-400 font-semibold">
                  {props.text1}
                </Text>
                {props.text2 && (
                  <Text className="text-slate-300 text-sm">
                    {props.text2}
                  </Text>
                )}
              </View>
            ),
          }}
        />
      </>
    </ClerkProvider>
  );
}