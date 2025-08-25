"use client";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

type Task = {
  task_id: string;
  title: string;
  description?: string;
  plan?: { date?: string; goal?: { goal_id: string; title: string } };
};
type Quiz = { quiz_id: string; title: string; questions: Question[] };
type Question = { question_id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string };

export default function QuizzesPage() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; correct: number } | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const userId = session?.user?.user_id as string | undefined;

  const { data: tasksRes, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ["user-tasks", userId],
    queryFn: async () => {
  const res = await api.get(`/api/users/${userId}/tasks`);
      return res.data;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const tasks = (tasksRes?.tasks || []).filter((t) => !!t.plan?.date);

  // Helpers for date ops (local time)
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = new Date();
  const todayKey = ymd(today);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  // Exclude future tasks (plan.date > end of today)
  const pastAndToday = tasks.filter((t) => {
    const d = new Date(t.plan!.date!);
    return d.getTime() <= endOfToday.getTime();
  });

  // Partition
  const todayTasks = pastAndToday.filter((t) => ymd(new Date(t.plan!.date!)) === todayKey);
  const previous = pastAndToday.filter((t) => ymd(new Date(t.plan!.date!)) !== todayKey);

  // Group previous by date key and sort date keys desc (newest first)
  const prevGroups = previous.reduce<Record<string, Task[]>>((acc, t) => {
    const key = ymd(new Date(t.plan!.date!));
    (acc[key] ||= []).push(t);
    return acc;
  }, {});
  const prevKeysSorted = Object.keys(prevGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const genQuiz = useMutation({
    mutationFn: async (taskId: string) => {
  const res = await api.get(`/api/quizzes/from-task/${taskId}`, { params: { count: 12 } });
      return res.data as Quiz;
    },
    onMutate: (taskId: string) => {
      setLoadingTaskId(taskId);
    },
    onSuccess: (quiz) => {
      setActiveQuiz(quiz);
      setAnswers({});
  setResult(null);
      setOpen(true);
    },
    onError: () => {
      // Optionally, you can surface a toast here.
    },
    onSettled: () => {
      setLoadingTaskId(null);
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async () => {
      if (!activeQuiz || !userId) throw new Error("No quiz");
      const payload = {
        user_id: userId,
        answers: Object.entries(answers).map(([question_id, selected_option]) => ({ question_id, selected_option })),
      };
  const res = await api.post(`/api/quizzes/${activeQuiz.quiz_id}/submit`, payload);
      return res.data as { score: number; total: number; correct: number };
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const missing = useMemo(() => {
    if (!activeQuiz) return 0;
    return activeQuiz.questions.filter(q => !answers[q.question_id]).length;
  }, [activeQuiz, answers]);

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">Quizzes</h1>
        </div>

        {/* Task list to pick from (Today first, then previous days) */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="text-sm text-gray-600">Pick a task to generate a quiz (10–20 questions). Future tasks are hidden.</div>
          {isLoading && <div className="text-sm text-gray-500">Loading tasks…</div>}

          {/* Today section */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Today</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {todayTasks.map((t) => (
                <button
                  key={t.task_id}
                  className="relative text-left border rounded-md p-3 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                  onClick={() => genQuiz.mutate(t.task_id)}
                  disabled={(genQuiz as any).isPending}
                >
                  <div className="font-medium text-gray-900 line-clamp-1">{t.title}</div>
                  {t.plan?.goal?.title && <div className="text-xs text-teal-700 mt-0.5">{t.plan.goal.title}</div>}
                  {t.description && <div className="text-xs text-gray-500 line-clamp-2 mt-1">{t.description}</div>}
                  {(genQuiz as any).isPending && loadingTaskId === t.task_id && (
                    <div className="absolute right-3 top-3 h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              ))}
              {todayTasks.length === 0 && !isLoading && (
                <div className="text-sm text-gray-500">No tasks for today.</div>
              )}
            </div>
          </div>

          {/* Previous days */}
          {prevKeysSorted.length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs font-semibold text-gray-700 mb-2">Previous Days</div>
              <div className="space-y-3">
                {prevKeysSorted.map((key) => (
                  <div key={key}>
                    <div className="text-xs text-gray-500 mb-1">{new Date(key).toLocaleDateString()}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {prevGroups[key].map((t) => (
                        <button
                          key={t.task_id}
                          className="relative text-left border rounded-md p-3 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                          onClick={() => genQuiz.mutate(t.task_id)}
                          disabled={(genQuiz as any).isPending}
                        >
                          <div className="font-medium text-gray-900 line-clamp-1">{t.title}</div>
                          {t.plan?.goal?.title && <div className="text-xs text-teal-700 mt-0.5">{t.plan.goal.title}</div>}
                          {t.description && <div className="text-xs text-gray-500 line-clamp-2 mt-1">{t.description}</div>}
                          {(genQuiz as any).isPending && loadingTaskId === t.task_id && (
                            <div className="absolute right-3 top-3 h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastAndToday.length === 0 && !isLoading && (
            <div className="text-sm text-gray-500">No past or today tasks found.</div>
          )}
        </div>

        {/* Modal */}
        {open && activeQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Quiz</div>
                  <div className="text-lg font-semibold text-gray-900">{activeQuiz.title}</div>
                </div>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setOpen(false)}>✕</button>
              </div>

              <div className="p-4 space-y-4">
                {activeQuiz.questions.map((q, idx) => (
                  <div key={q.question_id} className="border rounded-md p-3">
                    <div className="text-sm text-gray-900 mb-2">{idx + 1}. {q.question_text}</div>
                    <div className="grid grid-cols-1 gap-2">
                      {[['A', q.option_a], ['B', q.option_b], ['C', q.option_c], ['D', q.option_d]].map(([key, val]) => (
                        <label key={key as string} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={q.question_id}
                            value={key as string}
                            checked={answers[q.question_id] === key}
                            onChange={() => setAnswers((m) => ({ ...m, [q.question_id]: key as string }))}
                          />
                          <span className="text-sm text-gray-700">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  {result ? (
                    <span className="font-medium text-gray-900">Score: {result.score}%</span>
                  ) : (
                    missing > 0 ? `${missing} unanswered` : 'All answered'
                  )}
                  {result && (
                    <span className="ml-2 text-gray-500">({result.correct}/{result.total} correct)</span>
                  )}
                </div>

                {result ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setOpen(false); setActiveQuiz(null); setResult(null); }}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={(submitQuiz as any).isPending}
                    onClick={() => submitQuiz.mutate()}
                    className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {(submitQuiz as any).isPending ? 'Submitting…' : 'Submit Quiz'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Global generating overlay before modal opens */}
      {(genQuiz as any).isPending && !open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-md p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-gray-700">Generating quiz… This may take a few seconds.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
