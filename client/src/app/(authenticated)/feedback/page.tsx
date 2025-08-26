"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

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

type Recommendation = {
  recommendation_id: string;
  recommendation_text: string;
  recommendation_type: 'revise' | 'advance' | 'slow_down' | 'repeat_easy';
  created_at: string;
};

function InsightBadge({ children, color = "teal" }: { children: React.ReactNode; color?: "teal" | "indigo" | "sky" | "amber" | "rose" | "slate" }) {
  const bg = {
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  }[color];
  return <div className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium ${bg}`}>{children}</div>;
}

export default function FeedbackPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [chatInput, setChatInput] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery<Summary>({
    queryKey: ["progress-summary", session?.user?.user_id],
    queryFn: async () => {
  const res = await api.get(`/api/progress/${session!.user.user_id}/summary`);
      return res.data;
    },
    enabled: !!session?.user?.user_id,
  });

  const { data: recsData, isLoading: recsLoading } = useQuery<{ recommendations: Recommendation[]}>({
    queryKey: ["ai-recommendations", session?.user?.user_id],
    queryFn: async () => {
  const res = await api.get(`/api/users/${session!.user.user_id}/recommendations`);
      return res.data;
    },
    enabled: !!session?.user?.user_id,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
  const res = await api.post(`/api/users/${session!.user.user_id}/recommendations/generate`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-recommendations", session?.user?.user_id] });
    },
  });

  const chatMutation = useMutation<{ answer: string }, unknown, string>({
    mutationFn: async (prompt: string) => {
  const res = await api.post(`/api/users/${session!.user.user_id}/chat`, { prompt });
      return res.data;
    },
    onSuccess: (res) => setChatAnswer(res.answer),
  });

  // Derived metrics for insights
  const studiedDays = (data?.dailyStudyTime || []).filter(d => (d.minutes || 0) > 0).length;
  const weeklyMinutes = (data?.dailyStudyTime || []).reduce((a, b) => a + (b.minutes || 0), 0);
  const avgSessionMin = studiedDays ? Math.round(weeklyMinutes / studiedDays) : 0;
  const monthly = data?.monthlyTaskCompletion ?? [];
  const lastMonth = monthly[monthly.length - 1];
  const prevMonth = monthly[monthly.length - 2];
  const lastCompletionRate = lastMonth ? Math.round((lastMonth.completed / Math.max(1, lastMonth.completed + lastMonth.skipped)) * 100) : 0;
  const prevCompletionRate = prevMonth ? Math.round((prevMonth.completed / Math.max(1, prevMonth.completed + prevMonth.skipped)) * 100) : 0;
  const trend = lastCompletionRate - prevCompletionRate;
  const latestQuiz = data?.quizPerformance?.[0];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">AI Feedback and Recommendations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Discover personalized insights and actionable advice based on your study habits and progress. Let AI guide you to more effective learning.
          </p>
        </div>

  {(isLoading || recsLoading) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg border border-gray-200 bg-white p-4">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-3 h-3 w-full rounded bg-gray-100" />
                <div className="mt-2 h-3 w-5/6 rounded bg-gray-100" />
                <div className="mt-6 h-8 w-32 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-700">Failed to load insights.</div>
        )}

        {data && (
          <>
            {/* Chat Section */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-gray-900">Ask AI a Question or Request a Report</h2>
              <p className="mt-1 text-sm text-gray-600">Get instant personalized feedback or generate a detailed study report.</p>
              <div className="mt-3">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="E.g., 'Analyze my progress in organic chemistry' or 'Suggest ways to improve focus during long study sessions.'"
                  className="w-full rounded-md border border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 p-3 min-h-[120px] outline-none"
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => chatInput.trim() && chatMutation.mutate(chatInput.trim())}
                  disabled={chatMutation.isPending || !chatInput.trim()}
                  className="inline-flex items-center rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {chatMutation.isPending ? 'Asking…' : 'Ask AI'}
                </button>
                <button
                  onClick={() => { setChatInput(""); setChatAnswer(null); }}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear Input
                </button>
              </div>
              {chatAnswer && (
                <div className="mt-4 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-800 whitespace-pre-wrap">{chatAnswer}</div>
              )}
            </div>

            {/* AI Recommendations header bar */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">AI Recommendations</h2>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="inline-flex items-center rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {generateMutation.isPending ? 'Generating…' : 'Generate New' }
              </button>
            </div>

            {/* Render recommendations if exist */}
            {recsData?.recommendations?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {recsData.recommendations.map((r) => (
                  <div key={r.recommendation_id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 capitalize">{r.recommendation_type.replace('_', ' ')}</div>
                      <InsightBadge color={r.recommendation_type === 'advance' ? 'indigo' : r.recommendation_type === 'revise' ? 'teal' : r.recommendation_type === 'slow_down' ? 'amber' : 'slate'}>
                        AI Suggestion
                      </InsightBadge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{r.recommendation_text}</p>
                    <div className="mt-3 text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-8 rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">No recommendations yet. Click &quot;Generate New&quot; to create personalized tips.</div>
            )}
            <h2 className="mt-2 mb-3 text-base font-semibold text-gray-900">Your Latest Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Optimal Study Pacing */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">Optimal Study Pacing</div>
                  <InsightBadge color="teal">Focus Rhythm</InsightBadge>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {studiedDays > 0
                    ? `Your recent sessions average about ${Math.max(1, Math.round(avgSessionMin))} minutes on days you study. ${avgSessionMin < 40 ? "Consider 45-minute focus blocks with 10-minute breaks." : avgSessionMin > 90 ? "Add more frequent short breaks to avoid fatigue." : "This aligns well with the Pomodoro rhythm—keep it up!"}`
                    : "We couldn't detect study sessions this week. Try short focused blocks to get started."}
                </p>
                <div className="mt-4">
                  <a
                    href="https://francescocirillo.com/pages/pomodoro-technique"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Learn More about Pomodoro
                  </a>
                </div>
              </div>

              {/* Goal Realignment Suggestion */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">Goal Realignment Suggestion</div>
                  <InsightBadge color="indigo">Strategy</InsightBadge>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {trend >= 5
                    ? `Great momentum—your completion rate improved ${trend}% compared to last month. You might increase difficulty slightly for a healthy challenge.`
                    : trend <= -5
                    ? `Your completion rate dipped ${Math.abs(trend)}% vs last month. Consider reducing scope or splitting tasks for quicker wins.`
                    : `Your completion rate is steady at ${lastCompletionRate}%. Keep a consistent plan and review upcoming milestones.`}
                </p>
                <div className="mt-4">
                  <Link href="/plan" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Adjust Goal</Link>
                </div>
              </div>

              {/* Task Completion Consistency */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">Task Completion Consistency</div>
                  <InsightBadge color="sky">Reliability</InsightBadge>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {lastMonth
                    ? `This month, you've completed ${lastMonth.completed} tasks and skipped ${lastMonth.skipped}. Completion rate: ${lastCompletionRate}%. Review previously skipped items to avoid knowledge gaps.`
                    : "We will show your monthly completion once you start studying."}
                </p>
                <div className="mt-4">
                  <Link href="/progress" className="inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">Review Tasks</Link>
                </div>
              </div>

              {/* Quiz Performance Trends */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">Quiz Performance Trends</div>
                  <InsightBadge color="amber">Recall</InsightBadge>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {latestQuiz
                    ? `Your recent quiz "${latestQuiz.title}" scored ${latestQuiz.accuracy}%. ${latestQuiz.accuracy >= 80 ? "Strong understanding—try spaced review to retain." : "Focus on weak questions and retry after a short break."}`
                    : "Take a quick quiz to measure understanding and get targeted review suggestions."}
                </p>
                <div className="mt-4">
                  <Link href="/quizzes" className="inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Revisit Topic</Link>
                </div>
              </div>

              {/* Effective Resource Utilization */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">Effective Resource Utilization</div>
                  <InsightBadge color="slate">Study Tips</InsightBadge>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {avgSessionMin >= 60
                    ? "Longer sessions detected—sprinkle in active recall and short summaries every 25–30 minutes for better retention."
                    : "Shorter sessions pair well with interactive resources (videos, quizzes, flashcards) to maximize focus and recall."}
                </p>
                <div className="mt-4">
                  <Link href="/quizzes" className="inline-flex items-center rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900">Explore Resources</Link>
                </div>
              </div>

              {/* Upcoming Challenge Alert */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">Upcoming Challenge Alert</div>
                  <InsightBadge color="rose">Heads-up</InsightBadge>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {data.overview.activeGoals > 0
                    ? "Stay ahead by previewing next topics and scheduling a lighter review day before tougher material."
                    : "Create a study goal to receive proactive prep tips for upcoming topics."}
                </p>
                <div className="mt-4">
                  <Link href="/plan" className="inline-flex items-center rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700">Prepare Now</Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
