"use client";
import { use } from "react";
import DailyPlansPage from "../page";

export default function GoalPlanPage({ params }: { params: Promise<{ goalId: string }> }) {
  // We now show all goals' plans for the selected day; ignore goalId param
  use(params); // consume to avoid unused var warning in React 19
  return <DailyPlansPage />;
}
