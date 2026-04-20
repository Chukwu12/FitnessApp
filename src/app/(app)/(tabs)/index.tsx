import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { client } from "@/lib/sanity/client";
import { calculateStats } from "@/lib/stats";
import { defineQuery } from "groq";
import { LineChart } from "react-native-chart-kit";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";


// 🧑‍💻 GROQ QUERY TO FETCH WORKOUTS FOR THE USER
const getWorkoutsQuery = defineQuery(`
*[_type == "workout" && userId == $userId]
| order(date desc) {
  _id,
  date,
  duration,
  exercises[] {
    _key,
    exercise->{
      name
    }
  }
}
`);


// 🏋️ WORKOUT TYPE DEFINITION
type Workout = {
  _id: string;
  date?: string;
  duration?: number;
  exercises?: {
    exercise?: {
      name?: string;
    };
  }[];
};

type AiWorkout = {
  title: string;
  duration: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
  }[];
};

const isAiWorkout = (value: unknown): value is AiWorkout => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const workout = value as Partial<AiWorkout>;

  return (
    typeof workout.title === "string" &&
    typeof workout.duration === "string" &&
    Array.isArray(workout.exercises)
  );
};

// 📅 Get last 7 days (labels + actual dates)
const getLast7Days = () => {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    days.push({
      date: d,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }

  return days;
};

export default function Page() {


  // 🏋️ WORKOUT HISTORY 
  const { user } = useUser();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiWorkout, setAiWorkout] = useState<AiWorkout | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const days = useMemo(() => getLast7Days(), []);




  // 🔥 Find selected date based on chart interaction
  const selectedDate = selectedDayIndex !== null
    ? getLast7Days()[selectedDayIndex].date
    : null;


  // 🔥 Filter workouts for the selected date (if any)
  const selectedDayWorkouts = useMemo(() => {
    if (!selectedDate) return [];

    return workouts.filter((w) => {
      if (!w.date) return false;

      return (
        new Date(w.date).toDateString() ===
        selectedDate.toDateString()
      );
    });
  }, [selectedDate, workouts]);


  // ▶️ FUNCTION TO FETCH AI-GENERATED WORKOUT 
  const getAiWorkout = async () => {
    try {
      setAiLoading(true);

      if (!BACKEND_URL) {
        console.error("Missing EXPO_PUBLIC_BACKEND_URL");
        setAiWorkout(null);
        return;
      }
      // 🧑‍💻 CALL BACKEND TO GET AI WORKOUT
      const response = await fetch(`${BACKEND_URL}/api/ai/workout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fitnessLevel:
            totalWorkouts > 20
              ? "advanced"
              : totalWorkouts > 5
                ? "intermediate"
                : "beginner",
          goal: "build muscle",
          recentWorkouts: workouts.slice(0, 5),
        }),
      });


      const data = await response.json();

      if (!response.ok) {
        console.error("AI workout request failed:", data);
        setAiWorkout(null);
        return;
      }

      if (!isAiWorkout(data)) {
        console.error("Invalid AI workout payload:", data);
        setAiWorkout(null);
        return;
      }

      setAiWorkout(data);
    } catch (err) {
      console.error("AI workout error:", err);
      setAiWorkout(null);
    } finally {
      setAiLoading(false);
    }
  };


  // 👤 USER DATA
  const userName = user?.firstName || "Guest";

  // 🔄 FETCH WORKOUTS ON COMPONENT MOUNT
  useEffect(() => {
    const fetchWorkouts = async () => {
      // ✅ HANDLE GUEST USERS
      if (!user?.id) {
        setWorkouts([]);     // empty state
        setLoading(false);   // stop loading
        return;
      }

      try {
        const data = await client.fetch<Workout[]>(getWorkoutsQuery, {
          userId: user.id,
        });

        setWorkouts(data);
      } catch (err) {
        console.error("Error fetching workouts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [user?.id]);

  // ▶️ CHECK IF USER HAS ACTIVE WORKOUT
  const hasActiveWorkout = true;

  // 🧮 CALCULATE STATS USING THE UTILS
  const { totalWorkouts, totalMinutes, streak } = useMemo(
    () => calculateStats(workouts),
    [workouts]
  );



  // 📊 STATS DATA (Section you're currently working on)
  const stats = useMemo<
    ReadonlyArray<{
      label: string;
      value: string;
      icon: "bar-chart-outline" | "time-outline" | "flame-outline";
    }>
  >(
    () => [
      {
        label: "Workouts",
        value: String(totalWorkouts),
        icon: "bar-chart-outline",
      },
      {
        label: "Minutes",
        value: String(totalMinutes),
        icon: "time-outline",
      },
      {
        label: "Streak",
        value: `${streak} days`,
        icon: "flame-outline",
      },
    ],
    [totalWorkouts, totalMinutes, streak]
  );

  // 🕘 RECENT ACTIVITY DATA
  const recentActivity = useMemo(() => {
    return workouts.slice(0, 3).map((w) => ({
      name:
        w.exercises?.[0]?.exercise?.name || "Workout Session",
      date: w.date
        ? new Date(w.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
        : "Unknown",
      duration: `${Math.round((w.duration ?? 0) / 60)} min`,
    }));
  }, [workouts]);

  // 📊 WEEKLY PROGRESS DATA FOR CHART
  const weeklyData = useMemo(() => {

    return {
      labels: days.map((d) => d.label),
      datasets: [
        {
          data: days.map((d) => {
            const dayStr = d.date.toDateString();

            const workoutsForDay = workouts.filter((w) => {
              if (!w.date) return false;
              return new Date(w.date).toDateString() === dayStr;
            });

            // 🔥 Use duration (lighter than volume for home)
            return workoutsForDay.reduce((sum, w) => {
              return sum + Math.round((w.duration ?? 0) / 60);
            }, 0);
          }),
        },
      ],
    };
  }, [workouts]);


  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <Text className="text-white">Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

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

        {user ? (
          <>
            <QuickStatsRow stats={stats} />
            {/* 📈 WEEKLY PROGRESS CHART */}
            <WeeklyChart
              data={weeklyData}
              selectedDayIndex={selectedDayIndex}
              setSelectedDayIndex={setSelectedDayIndex}
            />
            {selectedDayIndex !== null && (
              <View className="mt-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">

                <Text className="text-white font-semibold mb-2">
                  {days[selectedDayIndex].label} Activity
                </Text>

                {selectedDayWorkouts.length === 0 ? (
                  <Text className="text-slate-400">
                    No workouts this day
                  </Text>
                ) : (
                  selectedDayWorkouts.map((w) => (
                    <View key={w._id} className="mb-2">
                      <Text className="text-white font-medium">
                        {w.exercises?.[0]?.exercise?.name || "Workout"}
                      </Text>

                      <Text className="text-slate-400 text-sm">
                        {Math.round((w.duration ?? 0) / 60)} min
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        ) : (
          <Text className="text-slate-500 mt-4">
            Sign in to unlock your progress tracking
          </Text>
        )}

        {/* 🔥 TODAY'S WORKOUT CARD */}
        <TodayWorkoutCard
          workout={
            aiWorkout
              ? {
                title: aiWorkout.title,
                duration: aiWorkout.duration,
                exercises: aiWorkout.exercises.length,
              }
              : {
                title: "Generate Workout",
                duration: "--",
                exercises: 0,
              }
          }
          onGenerateWorkout={getAiWorkout}
          isLoading={aiLoading}
        />


        {/* ▶️ CONTINUE / START WORKOUT */}
        <ContinueWorkoutCard hasActiveWorkout={hasActiveWorkout} />

        {/* 🕘 RECENT ACTIVITY */}
        <RecentActivitySection items={recentActivity} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 📈 WEEKLY PROGRESS CHART COMPONENT
function WeeklyChart({ data, selectedDayIndex, setSelectedDayIndex, }: {
  data: any;
  selectedDayIndex: number | null;
  setSelectedDayIndex: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const screenWidth = Dimensions.get("window").width;


  return (
    <View className="mb-6">
      <Text className="text-white text-xl font-bold mb-3">
        Weekly Activity
      </Text>

      <LineChart
        data={data}
        width={screenWidth - 32}
        height={180}
        onDataPointClick={({ index }) => {
          setSelectedDayIndex((prev) => (prev === index ? null : index));
        }}
        getDotColor={(value, index) =>
          index === selectedDayIndex ? "#22C55E" : "#475569"
        }
        chartConfig={{
          backgroundGradientFrom: "#020617",
          backgroundGradientTo: "#020617",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          labelColor: () => "#94A3B8",
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#22C55E",
          },
        }}
        bezier
      />
    </View>
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
        <Text className="text-slate-400 text-base">Welcome To FitStack  👋</Text>

        {/* 👤 USER NAME */}
        <Text className="text-white text-3xl font-bold mt-1">{userName}</Text>

        {/* 💬 SUBTEXT */}
        <Text className="text-slate-500 text-sm mt-1">
          Ready to build consistency today?
        </Text>
      </View>

      {/* 👤 PROFILE ICON */}
      <View className="h-12 w-12 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
        <Ionicons name="person" size={20} color="#F8FAFC" />
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
  onGenerateWorkout,
  isLoading,
}: {
  workout: { title: string; duration: string; exercises: number };
  onGenerateWorkout: () => Promise<void>;
  isLoading: boolean;
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
              <Ionicons name="time-outline" size={14} color="#020617" />
              <Text className="text-slate-950 ml-2 font-medium">
                {workout.duration}
              </Text>
            </View>

            {/* EXERCISE COUNT */}
            <View className="flex-row items-center">
              <Ionicons name="book-outline" size={14} color="#020617" />
              <Text className="text-slate-950 ml-2 font-medium">
                {workout.exercises} exercises
              </Text>
            </View>
          </View>
        </View>

        {/* ▶️ PLAY ICON BOX */}
        <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center border border-white/20">
          <Ionicons name="play" size={22} color="#020617" />
        </View>
      </View>

      {/* ▶️ START BUTTON */}
      <TouchableOpacity
        onPress={onGenerateWorkout}
        className="bg-slate-950 rounded-2xl py-4 items-center mt-5 active:scale-95"
      >
        <Text className="text-white font-semibold text-base">
          {isLoading ? "Generating..." : "Generate Workout"}
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
  stats: ReadonlyArray<{
    label: string;
    value: string;
    icon: "bar-chart-outline" | "time-outline" | "flame-outline";
  }>;
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
            className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 active:scale-95"
          >
            {/* 📊 ICON */}
            <Ionicons name={stat.icon} size={18} color="#22C55E" />

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
    <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
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
          <Ionicons
            name={hasActiveWorkout ? "arrow-forward" : "add"}
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
      <TouchableOpacity activeOpacity={0.8} className="bg-green-500 rounded-2xl py-4 items-center mt-5 active:scale-95">
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
              <View className="h-12 w-12 rounded-2xl bg-slate-800 items-center justify-center mr-3">
                <Ionicons name="calendar" size={18} color="#38BDF8" />
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
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </View>
        ))}
      </View>
    </View>
  );
}