import { useMemo } from "react";
import { calculateStats } from "@/lib/stats";

export const useStats = (workouts: any[]) => {
  return useMemo(() => calculateStats(workouts), [workouts]);
};