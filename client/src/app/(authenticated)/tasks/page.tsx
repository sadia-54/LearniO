"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

interface TaskItem {
  task_id: string;
  title: string;
  description?: string;
  type?: string;
  estimated_duration?: number;
  status: "incomplete" | "complete" | "skipped";
  completed_at?: string | null;
  plan?: { date: string; goal?: { goal_id: string; title: string } };
}

export default function TasksPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "incomplete" | "complete" | "skipped">("all");

  const { data, isLoading } = useQuery<{ tasks: TaskItem[] }>({
    queryKey: ["userTasks", session?.user?.user_id, filter],
    queryFn: async () => {
      const qs = filter === "all" ? "" : `?status=${filter}`;
  const res = await api.get(`/api/users/${session!.user.user_id}/tasks${qs}`);
      return res.data;
    },
    enabled: !!session?.user?.user_id,
  });

  const tasks = data?.tasks || [];
  const grouped = useMemo(() => {
    const byStatus: Record<string, TaskItem[]> = { incomplete: [], complete: [], skipped: [] };
    for (const t of tasks) byStatus[t.status].push(t);
    return byStatus;
  }, [tasks]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: "incomplete" | "complete" | "skipped" }) => {
  const res = await api.put(`/api/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onSuccess: async () => {
      // Recompute and persist Progress on the server from current Tasks
      if (session?.user?.user_id) {
        try {
          await api.post(`/api/users/${session.user.user_id}/progress/recompute`);
        } catch {}
      }
      // Refresh local caches
      queryClient.invalidateQueries({ queryKey: ["userTasks", session?.user?.user_id, filter] });
      queryClient.invalidateQueries({ queryKey: ["progress-summary", session?.user?.user_id] });
      queryClient.invalidateQueries({ queryKey: ["completed-tasks", session?.user?.user_id] });
      queryClient.invalidateQueries({ queryKey: ["skipped-tasks", session?.user?.user_id] });
    }
  });

  const Section = ({ title, items }: { title: string; items: TaskItem[] }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">{items.length} task(s)</span>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500 mb-6">No tasks in this category.</div>
      ) : (
  <div className="grid grid-cols-1 gap-4 mb-8">
          {items.map((task) => (
            <div key={task.task_id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm text-gray-500">{task.plan?.goal?.title || "Goal"}</div>
                  <div className="text-xs text-gray-400">{task.plan?.date ? new Date(task.plan.date).toLocaleDateString() : ""}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === 'complete' ? 'bg-green-100 text-green-800' :
                  task.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {task.status}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{task.title}</h3>
              {task.description && <p className="text-sm text-gray-600 mb-3">{task.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                {task.type && <span>{task.type}</span>}
                {typeof task.estimated_duration === 'number' && <span>{task.estimated_duration} min</span>}
              </div>
              <div className="flex space-x-2">
                {task.status !== 'complete' && (
                  <button
                    onClick={() => updateTaskMutation.mutate({ taskId: task.task_id, status: 'complete' })}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    <span>✔</span>
                    <span>Complete</span>
                  </button>
                )}
                {task.status !== 'skipped' && (
                  <button
                    onClick={() => updateTaskMutation.mutate({ taskId: task.task_id, status: 'skipped' })}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    <span>↷</span>
                    <span>Skip Task</span>
                  </button>
                )}
                {task.status !== 'incomplete' && (
                  <button
                    onClick={() => updateTaskMutation.mutate({ taskId: task.task_id, status: 'incomplete' })}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    <span>▶</span>
                    <span>Mark Pending</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">Task Tracking</h1>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "incomplete", "complete", "skipped"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded border text-sm ${filter === f ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-700 border-gray-200'}`}>{f === 'incomplete' ? 'pending' : f}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">Loading tasks…</div>
        ) : (
          <>
            <Section title="Pending Tasks" items={grouped.incomplete} />
            <Section title="Completed Tasks" items={grouped.complete} />
            <Section title="Skipped Tasks" items={grouped.skipped} />
          </>
        )}
      </div>
    </div>
  );
}
