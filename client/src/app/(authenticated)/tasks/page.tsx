"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
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
      const res = await axios.get(`http://localhost:5000/api/users/${session!.user.user_id}/tasks${qs}`);
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
      const res = await axios.put(`http://localhost:5000/api/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTasks", session?.user?.user_id, filter] });
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
                  <button onClick={() => updateTaskMutation.mutate({ taskId: task.task_id, status: 'complete' })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs font-medium">Mark Complete</button>
                )}
                {task.status !== 'skipped' && (
                  <button onClick={() => updateTaskMutation.mutate({ taskId: task.task_id, status: 'skipped' })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs font-medium">Skip</button>
                )}
                {task.status !== 'incomplete' && (
                  <button onClick={() => updateTaskMutation.mutate({ taskId: task.task_id, status: 'incomplete' })} className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded text-xs font-medium">Mark Pending</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">Task Tracking</h1>
          <div className="flex items-center space-x-2">
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
