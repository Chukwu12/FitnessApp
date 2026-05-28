import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
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

type NutritionAdvice = {
  goal: string;
  description: string;
  dailyCalories: string;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  tips: string[];
  mealSuggestions: Array<{
    meal: string;
    name: string;
    calories: string;
  }>;
};

const isNutritionAdvice = (value: unknown): value is NutritionAdvice => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const advice = value as Partial<NutritionAdvice>;

  return (
    typeof advice.goal === "string" &&
    typeof advice.description === "string" &&
    typeof advice.dailyCalories === "string" &&
    !!advice.macros &&
    Array.isArray(advice.tips) &&
    Array.isArray(advice.mealSuggestions)
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
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutritionAdvice, setNutritionAdvice] = useState<NutritionAdvice | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
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


  // ▶️ FUNCTION TO FETCH AI-GENERATED NUTRITION ADVICE
  const getNutritionAdvice = async () => {
    try {
      setNutritionLoading(true);

      if (!BACKEND_URL) {
        console.error("Missing EXPO_PUBLIC_BACKEND_URL");
        setNutritionAdvice(null);
        return;
      }

      // 🧑‍💻 CALL BACKEND TO GET NUTRITION ADVICE
      const response = await fetch(`${BACKEND_URL}/api/ai/nutrition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fitness_level:
            totalWorkouts > 20
              ? "advanced"
              : totalWorkouts > 5
                ? "intermediate"
                : "beginner",
          goal: "Build muscle",
          dietary_preferences: ["High protein", "Balanced carbs"],
          health_conditions: ["None"],
          schedule: {
            days_per_week: 4,
            session_duration: 60,
          },
        }),
      });


      const data = await response.json();

      if (!response.ok) {
        console.error("Nutrition advice request failed:", data);
        setNutritionAdvice(null);
        return;
      }

      if (!isNutritionAdvice(data)) {
        console.error("Invalid nutrition payload:", data);
        setNutritionAdvice(null);
        return;
      }

      setNutritionAdvice(data);
    } catch (err) {
      console.error("Nutrition advice error:", err);
      setNutritionAdvice(null);
    } finally {
      setNutritionLoading(false);
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

  const handleContinueWorkout = () => {
    router.push("/active-workout");
  };

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

        {/* 🥗 DAILY NUTRITION CARD */}
        <NutritionAdviceCard
          advice={nutritionAdvice}
          onGenerateAdvice={getNutritionAdvice}
          isLoading={nutritionLoading}
        />


        {/* ▶️ CONTINUE / START WORKOUT */}
        <ContinueWorkoutCard
          hasActiveWorkout={hasActiveWorkout}
          onPrimaryPress={handleContinueWorkout}
        />

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
function NutritionAdviceCard({
  advice,
  onGenerateAdvice,
  isLoading,
}: {
  advice: NutritionAdvice | null;
  onGenerateAdvice: () => Promise<void>;
  isLoading: boolean;
}) {
  const tips = advice?.tips?.slice(0, 2) ?? [];
  const meals = advice?.mealSuggestions?.slice(0, 2) ?? [];

  return (
    // GRADIENT CARD BACKGROUND
    <LinearGradient
      colors={["#0EA5A4", "#0891B2"]}
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
            Today's Nutrition
          </Text>

          {/* 🥗 NUTRITION TITLE */}
          <Text className="text-slate-950 text-3xl font-extrabold mt-2">
            {advice?.goal || "Nutrition Advice"}
          </Text>

          {!!advice?.description && (
            <Text className="text-slate-950/80 text-sm mt-2" numberOfLines={3}>
              {advice.description}
            </Text>
          )}

          {/* 🔢 NUTRITION META INFO */}
          <View className="flex-row items-center mt-3">
            {/* CALORIES */}
            <View className="flex-row items-center mr-4">
              <Ionicons name="time-outline" size={14} color="#020617" />
              <Text className="text-slate-950 ml-2 font-medium">
                {advice?.dailyCalories ? `${advice.dailyCalories} kcal/day` : "--"}
              </Text>
            </View>

            {/* TIPS COUNT */}
            <View className="flex-row items-center">
              <Ionicons name="book-outline" size={14} color="#020617" />
              <Text className="text-slate-950 ml-2 font-medium">
                {tips.length} tips
              </Text>
            </View>
          </View>

          {/* MACROS */}
          <View className="mt-3">
            <Text className="text-slate-950 font-semibold text-xs mb-2">
              Macros
            </Text>

            <View className="flex-row flex-wrap">
              <MacroPill label="Protein" value={advice?.macros?.protein || "--"} />
              <MacroPill label="Carbs" value={advice?.macros?.carbs || "--"} />
              <MacroPill label="Fats" value={advice?.macros?.fats || "--"} />
            </View>
          </View>

          {/* TIPS */}
          {tips.length > 0 && (
            <View className="mt-3">
              {tips.map((tip, i) => (
                <Text key={`${tip}-${i}`} className="text-slate-950 text-xs mt-1">
                  - {tip}
                </Text>
              ))}
            </View>
          )}

          {/* MEAL SUGGESTIONS */}
          {meals.length > 0 && (
            <View className="mt-3">
              {meals.map((meal) => (
                <Text
                  key={`${meal.meal}-${meal.name}`}
                  className="text-slate-950 text-xs mt-1"
                >
                  {meal.meal}: {meal.name}
                  {meal.calories ? ` (${meal.calories} kcal)` : ""}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* 🥗 ICON BOX */}
        <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center border border-white/20">
          <Ionicons name="restaurant" size={22} color="#020617" />
        </View>
      </View>

      {/* ▶️ ACTION BUTTON */}
      <TouchableOpacity
        onPress={onGenerateAdvice}
        className="bg-slate-950 rounded-2xl py-4 items-center mt-5 active:scale-95"
      >
        <Text className="text-white font-semibold text-base">
          {isLoading
            ? "Generating..."
            : advice
              ? "Regenerate Nutrition Advice"
              : "Generate Nutrition Advice"}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="mr-2 mb-2 rounded-full bg-slate-950/20 border border-white/30 px-3 py-1">
      <Text className="text-slate-950 text-xs font-semibold">
        {label}: {value}
      </Text>
    </View>
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
function ContinueWorkoutCard({
  hasActiveWorkout,
  onPrimaryPress,
}: {
  hasActiveWorkout: boolean;
  onPrimaryPress: () => void;
}) {
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
      <TouchableOpacity
        onPress={onPrimaryPress}
        activeOpacity={0.8}
        className="bg-green-500 rounded-2xl py-4 items-center mt-5 active:scale-95"
      >
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