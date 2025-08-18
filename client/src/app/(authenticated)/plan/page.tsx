"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
// Removed unused import

interface Task {
  task_id: string;
  title: string;
  description?: string;
  type: string;
  estimated_duration: number;
  resource_url?: string;
  status: string;
  completed_at?: string;
}

interface Plan {
  plan_id: string;
  date: string;
  status: string;
  tasks: Task[];
  goal?: { goal_id: string; title: string };
}

interface DailyPlansResponse { plans: Plan[]; }

// No separate TodayPlanResponse; we derive the plan for currentDate from all plans

export default function DailyPlansPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Compute ISO date for the selected day (UTC)
  const targetIso = new Date(Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  )).toISOString().slice(0, 10);

  // Fetch all daily plans for current user on selected date (across all goals)
  const { data: allPlans, isLoading: plansLoading } = useQuery<DailyPlansResponse>({
    queryKey: ["userDailyPlans", session?.user?.user_id, targetIso],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/users/${session!.user.user_id}/daily-plans?date=${targetIso}`);
      return res.data;
    },
    enabled: !!session?.user?.user_id,
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const res = await axios.put(`http://localhost:5000/api/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["userDailyPlans", session?.user?.user_id, targetIso] });
    }
  });

  const handleTaskAction = (taskId: string, action: 'complete' | 'start') => {
    if (action === 'complete') {
      updateTaskMutation.mutate({ taskId, status: 'complete' });
    } else if (action === 'start') {
      // TaskStatus enum only allows incomplete|complete|skipped; keep it as incomplete until completed
      updateTaskMutation.mutate({ taskId, status: 'incomplete' });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'reading': return '📚';
      case 'video': return '🎥';
      case 'quiz': return '📝';
      default: return '✅';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (plansLoading) {
    return <div className="p-6">Loading daily plans...</div>;
  }

  // Plans list for the selected day across all goals
  const dayPlans = allPlans?.plans || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Your Daily Learning Plan</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-200">
            <button
              onClick={() => navigateDate('prev')}
              className="text-teal-600 hover:text-teal-800 px-3 py-1 rounded-lg hover:bg-teal-50"
            >
              ← Previous Day
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-lg">📅</span>
              <span className="font-medium text-gray-900">{formatDate(currentDate)}</span>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="text-teal-600 hover:text-teal-800 px-3 py-1 rounded-lg hover:bg-teal-50"
            >
              Next Day →
            </button>
          </div>
          <Link 
            href="/home"
            className="text-teal-600 hover:text-teal-800 text-sm"
          >
            ← Back to Goals
          </Link>
        </div>
      </div>
      <p className="text-gray-600 mb-6">All your goals' plans for the selected day.</p>
      {dayPlans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No plans for this day</h3>
          <p className="text-gray-600">Create goals with timelines to see daily plans here.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {dayPlans.map(plan => (
            <div key={plan.plan_id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{plan.goal?.title || 'Goal'}</h2>
                  <p className="text-sm text-gray-600">{new Date(plan.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  plan.status === 'done' ? 'bg-green-100 text-green-800' :
                  plan.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {plan.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.tasks.map(task => (
                  <div key={task.task_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl">{getTaskIcon(task.type)}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>{task.status.replace('_', ' ')}</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{task.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{task.estimated_duration} min</span>
                      {task.resource_url && (
                        <a href={task.resource_url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 text-xs">🔗 Resource</a>
                      )}
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button onClick={() => handleTaskAction(task.task_id, 'complete')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs font-medium">Complete</button>
                      <button onClick={() => handleTaskAction(task.task_id, 'start')} className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded text-xs font-medium">Start</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
