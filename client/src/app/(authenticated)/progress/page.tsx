"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";

type Overview = { totalTasksCompleted: number; activeGoals: number; weeklyStudyHours: number };
type MonthlyItem = { month: string; completed: number; skipped: number; skippedProjects?: number };
type DailyTime = { date: string; minutes: number };
type QuizPerf = { quiz_id: string; title: string; accuracy: number; date: string };
type Streak = { days: { date: string; hasStudy: boolean }[]; currentStreak: number };
type TaskWithPlan = { task_id: string; status: string; completed_at?: string; plan?: { date?: string } };

type Summary = {
  overview: Overview;
  monthlyTaskCompletion: MonthlyItem[];
  dailyStudyTime: DailyTime[];
  quizPerformance: QuizPerf[];
  streak: Streak;
};

// Simple utility to compute "nice" ticks for y-axes
function computeTicks(maxValue: number, tickCount = 4) {
  const max = Math.max(1, maxValue);
  const step = Math.ceil(max / tickCount);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);
  return { ticks, top: ticks[ticks.length - 1] };
}

function GroupedBarChart({
  labels,
  series,
  height = 220,
  colors = ["#10b981", "#a78bfa"],
  names = [],
}: {
  labels: string[];
  series: number[][]; // [completed, skipped, skippedProjects?]
  height?: number;
  colors?: string[];
  names?: string[];
}) {
  const padding = { top: 16, right: 16, bottom: 36, left: 36 };
  const innerH = height - padding.top - padding.bottom;
  const barW = 18;
  const groupGap = 22;
  const barGap = 10; // gap between bars within group
  const barsPerGroup = series.length;
  const width = padding.left + padding.right + labels.length * (barsPerGroup * barW + (barsPerGroup - 1) * barGap + groupGap);
  const allValues = series.reduce<number[]>((acc, arr) => acc.concat(arr as number[]), []);
  const { ticks, top } = computeTicks(Math.max(1, ...allValues), 4);
  const scaleY = (v: number) => padding.top + innerH - (v / top) * innerH;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Gridlines + Y labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={scaleY(t)}
            y2={scaleY(t)}
            stroke="#e5e7eb"
          />
          <text x={padding.left - 8} y={scaleY(t)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {/* X axis */}
      <line x1={padding.left} x2={width - padding.right} y1={padding.top + innerH} y2={padding.top + innerH} stroke="#e5e7eb" />

      {/* Bars */}
      {labels.map((label, i) => {
        const baseX = padding.left + i * (barsPerGroup * barW + (barsPerGroup - 1) * barGap + groupGap);
        return (
          <g key={label}>
            {series.map((arr, j) => {
              const v = (arr as number[])[i] ?? 0;
              const yRaw = scaleY(v);
              const x = baseX + j * (barW + barGap);
              const h = Math.max(2, padding.top + innerH - yRaw); // ensure tiny values still visible
              const y = padding.top + innerH - h;
              return (
                <g key={j}>
                  <rect x={x} y={y} width={barW} height={h} rx={4} fill={colors[j] || '#94a3b8'} stroke="#e2e8f0" />
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="fill-gray-500 text-[10px]">{v}</text>
                </g>
              );
            })}
            <text x={baseX + (barsPerGroup * barW + (barsPerGroup - 1) * barGap) / 2} y={padding.top + innerH + 16} textAnchor="middle" className="fill-gray-500 text-[10px]">
              {label}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${padding.left}, ${padding.top - 6})`}>
        {series.map((_, j) => (
          <g key={j} transform={`translate(${j * 120}, 0)`}>
            <rect width="10" height="10" rx="2" fill={colors[j] || '#94a3b8'} />
            <text x="14" y="9" className="fill-gray-600 text-[10px]">{names[j] || `Series ${j + 1}`}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function LineChart({
  labels,
  data,
  height = 220,
  color = "#0ea5e9",
}: { labels: string[]; data: number[]; height?: number; color?: string }) {
  const padding = { top: 16, right: 16, bottom: 36, left: 36 };
  const innerH = height - padding.top - padding.bottom;
  const w = padding.left + padding.right + Math.max(0, labels.length - 1) * 44; // 7 points ~ 264px
  const innerW = w - padding.left - padding.right;
  const { ticks, top } = computeTicks(Math.max(...data), 4);
  const scaleX = (i: number) => padding.left + (labels.length <= 1 ? 0 : (i * innerW) / (labels.length - 1));
  const scaleY = (v: number) => padding.top + innerH - (v / top) * innerH;

  const points = data.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(" ");

  return (
    <svg width={w} height={height} className="overflow-visible">
      {/* Gridlines & Y labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padding.left} x2={w - padding.right} y1={scaleY(t)} y2={scaleY(t)} stroke="#e5e7eb" />
          <text x={padding.left - 8} y={scaleY(t)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {/* X axis */}
      <line x1={padding.left} x2={w - padding.right} y1={padding.top + innerH} y2={padding.top + innerH} stroke="#e5e7eb" />

      {/* Line */}
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} />

      {/* Points */}
      {data.map((v, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(v)} r={3} fill={color} />
      ))}

      {/* X labels */}
      {labels.map((lbl, i) => (
        <text key={lbl + i} x={scaleX(i)} y={padding.top + innerH + 16} textAnchor="middle" className="fill-gray-500 text-[10px]">
          {lbl}
        </text>
      ))}

      {/* Legend */}
      <g transform={`translate(${padding.left}, ${padding.top - 6})`}>
        <circle cx="5" cy="5" r="5" fill={color} />
        <text x="14" y="9" className="fill-gray-600 text-[10px]">Hours</text>
      </g>
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

  // Fallback fetch for skipped tasks by month if the summary reports all zeros
  const skippedNeeded = !!data && data.monthlyTaskCompletion.every(m => (m.skipped || 0) === 0);
  const { data: skippedTasks } = useQuery<{ tasks: TaskWithPlan[] }>({
    queryKey: ["skipped-tasks", session?.user?.user_id],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/users/${session!.user.user_id}/tasks`, { params: { status: "skipped" } });
      return res.data;
    },
    enabled: !!session?.user?.user_id,
    staleTime: 1000 * 60,
  });

  const { data: completedTasks } = useQuery<{ tasks: TaskWithPlan[] }>({
    queryKey: ["completed-tasks", session?.user?.user_id],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/users/${session!.user.user_id}/tasks`, { params: { status: "complete" } });
      return res.data;
    },
    enabled: !!session?.user?.user_id,
    staleTime: 1000 * 60,
  });

  if (isLoading) return <div className="p-6">Loading progress…</div>;
  if (error || !data) return <div className="p-6 text-red-600">Failed to load progress.</div>;

  const months = data.monthlyTaskCompletion.map(m => m.month);
  let completed = data.monthlyTaskCompletion.map(m => m.completed);
  let skipped = data.monthlyTaskCompletion.map(m => m.skipped);
  if (skippedTasks?.tasks || completedTasks?.tasks) {
    // Build month keys for the last N months matching the months array length
    const N = months.length;
    const now = new Date();
    const monthKeys: string[] = [];
    for (let i = N - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(key);
    }
    const indexByKey = new Map(monthKeys.map((k, i) => [k, i] as const));
    const arr = new Array(N).fill(0);
    if (skippedTasks?.tasks) {
      for (const t of skippedTasks.tasks) {
        const d = new Date(t.plan?.date ?? t.completed_at ?? Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = indexByKey.get(key);
        if (idx !== undefined) arr[idx] += 1;
      }
      skipped = skipped.map((v, i) => Math.max(v || 0, arr[i] || 0));
    }

    if (completedTasks?.tasks) {
      const completedArr = new Array(N).fill(0);
      for (const t of completedTasks.tasks) {
        const d = new Date(t.completed_at ?? t.plan?.date ?? Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = indexByKey.get(key);
        if (idx !== undefined) completedArr[idx] += 1;
      }
      completed = completed.map((v, i) => Math.max(v || 0, completedArr[i] || 0));
    }
  }
  // Only show completed vs skipped tasks side-by-side as requested
  const studyMinutes = data.dailyStudyTime.map(d => Math.round((d.minutes || 0) / 60)); // convert to hours for chart
  const dayLabels = data.dailyStudyTime.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }));

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
              <div className="text-xs text-gray-500">Completed vs. Skipped tasks over time.</div>
            </div>
            <div className="overflow-x-auto">
              <GroupedBarChart labels={months} series={[completed, skipped]} names={["Completed Tasks", "Skipped Tasks"]} />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Daily Study Time Distribution</div>
              <div className="text-xs text-gray-500">Average hours spent studying per day this week.</div>
            </div>
            <div className="overflow-x-auto">
              <LineChart labels={dayLabels} data={studyMinutes} />
            </div>
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
