import { Stack } from "expo-router";

function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="workout-record"
        options={{
          headerShown: true,
          headerTitle: "Workout Record",
          headerBackTitle: "Workout History",
        }}
      />
    </Stack>
  );
}

export default Layout;
