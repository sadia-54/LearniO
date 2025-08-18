"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";

type Overview = { totalTasksCompleted: number; activeGoals: number; weeklyStudyHours: number };
type MonthlyItem = { month: string; completed: number; skipped: number };
type DailyTime = { date: string; minutes: number };
type QuizPerf = { quiz_id: string; title: string; accuracy: number; date: string };
type Streak = { days: { date: string; hasStudy: boolean }[]; currentStreak: number };

type Summary = {
  overview: Overview;
  monthlyTaskCompletion: MonthlyItem[];
  dailyStudyTime: DailyTime[];
  quizPerformance: QuizPerf[];
  streak: Streak;
};

function BarChart({ data, height = 160, color = "#14b8a6" }: { data: number[]; height?: number; color?: string }) {
  const max = Math.max(1, ...data);
  const barWidth = 24;
  const gap = 16;
  const width = data.length * (barWidth + gap) + gap;
  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((v, i) => {
        const h = Math.round((v / max) * (height - 20));
        const x = gap + i * (barWidth + gap);
        const y = height - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} rx={6} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, height = 160, color = "#0ea5e9" }: { data: number[]; height?: number; color?: string }) {
  const max = Math.max(1, ...data);
  const w = 280;
  const h = height;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - Math.round((v / max) * (h - 20)) - 10;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} />
      {data.map((v, i) => {
        const x = i * step;
        const y = h - Math.round((v / max) * (h - 20)) - 10;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

export default function ProgressPage() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useQuery<Summary>({
    queryKey: ["progress-summary", session?.user?.user_id],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/progress/${session!.user.user_id}/summary`);
      return res.data;
    },
    enabled: !!session?.user?.user_id,
  });

  if (isLoading) return <div className="p-6">Loading progress…</div>;
  if (error || !data) return <div className="p-6 text-red-600">Failed to load progress.</div>;

  const months = data.monthlyTaskCompletion.map(m => m.month);
  const completed = data.monthlyTaskCompletion.map(m => m.completed);
  const skipped = data.monthlyTaskCompletion.map(m => m.skipped);
  const studyMinutes = data.dailyStudyTime.map(d => d.minutes);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">Your Study Overview</h1>
          <div className="text-sm text-gray-500">Updated {new Date().toLocaleDateString()}</div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Tasks Completed</div>
            <div className="text-2xl font-semibold text-gray-900">{data.overview.totalTasksCompleted}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">Active Study Goals</div>
            <div className="text-2xl font-semibold text-gray-900">{data.overview.activeGoals}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">Weekly Study Hours</div>
            <div className="text-2xl font-semibold text-gray-900">{data.overview.weeklyStudyHours} hrs</div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Monthly Task Completion</div>
              <div className="text-xs text-gray-500">Completed vs Skipped</div>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <BarChart data={completed} />
                <div className="mt-2 text-xs text-gray-500">{months.join(" · ")}</div>
              </div>
              <div>
                <BarChart data={skipped} color="#94a3b8" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Daily Study Time Distribution</div>
              <div className="text-xs text-gray-500">Last 7 days</div>
            </div>
            <LineChart data={studyMinutes} />
          </div>
        </div>

        {/* Quiz overview + Streak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-3">Quiz Performance Overview</div>
            <div className="space-y-3">
              {data.quizPerformance.map((q) => (
                <div key={q.quiz_id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{q.title}</div>
                    <div className="text-xs text-gray-500">{new Date(q.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{q.accuracy}%</div>
                </div>
              ))}
              {data.quizPerformance.length === 0 && (
                <div className="text-sm text-gray-500">No quiz data yet.</div>
              )}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-3">Current Study Streak</div>
            <div className="text-sm text-gray-600 mb-2">{data.streak.currentStreak} day(s)</div>
            <div className="flex items-end gap-1">
              {data.streak.days.map((d) => (
                <div key={d.date} title={d.date} className={`h-8 w-3 rounded ${d.hasStudy ? 'bg-teal-600' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
