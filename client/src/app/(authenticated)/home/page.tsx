'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import GoalViewModal from '@/components/GoalViewModal';
import GoalEditModal from '@/components/GoalEditModal';
import CreateGoalModal from '@/components/CreateGoalModal';
import { useSearch } from "@/context/SearchContext";
import { filterGoals } from "@/utils/goalSearch";
import { useRouter } from 'next/navigation';

interface Goal {
  goal_id: string;
  title: string;
  description?: string;
  difficulty_level: string;
  start_date: string;
  end_date: string;
  status?: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const { searchTerm } = useSearch(); // get searchTerm from context
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Fetch goals from backend
  useEffect(() => {
    const fetchGoals = async () => {
      if (!session?.user?.user_id) return;

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/goals/user/${session.user.user_id}`);
        setGoals(response.data.goals);
        setError(null);
      } catch (err) {
        console.error('Error fetching goals:', err);
        setError('Failed to fetch goals');
        setGoals(getSampleGoals()); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [session?.user?.user_id]);

  // Filtered goals based on searchTerm from context
  const filteredGoals = filterGoals(goals, { searchTerm });

  // Sample goals fallback
  const getSampleGoals = (): Goal[] => [
    {
      goal_id: '1',
      title: "Master Calculus I",
      description: "Comprehensive study of differential and integral calculus, focusing on applications in physics and engineering.",
      difficulty_level: "Hard",
      start_date: "2024-09-01",
      end_date: "2024-12-15"
    },
    {
      goal_id: '2',
      title: "Learn Python Basics",
      description: "Introduction to Python programming language, covering syntax, data structures, control flow, and basic algorithms.",
      difficulty_level: "Easy",
      start_date: "2024-10-01",
      end_date: "2024-11-30"
    },
    {
      goal_id: '3',
      title: "Prepare for IELTS",
      description: "Intensive preparation for the International English Language Testing System (IELTS), focusing on all four skills.",
      difficulty_level: "Medium",
      start_date: "2024-08-15",
      end_date: "2024-09-30"
    }
  ];

  // Helper functions (difficulty color, emoji, date formatting) remain the same...
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalEmoji = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('calculus') || lowerTitle.includes('math')) return '🧮';
    if (lowerTitle.includes('python') || lowerTitle.includes('programming')) return '🐍';
    if (lowerTitle.includes('ielts') || lowerTitle.includes('english')) return '📚';
    if (lowerTitle.includes('machine learning') || lowerTitle.includes('ai')) return '🤖';
    if (lowerTitle.includes('speaking') || lowerTitle.includes('presentation')) return '🎤';
    if (lowerTitle.includes('research') || lowerTitle.includes('paper')) return '📝';
    return '🎯';
  };

  const formatDates = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return 'Dates not set';
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Modal handlers remain the same...
  const handleViewGoal = (goal: Goal) => { setSelectedGoal(goal); setViewModalOpen(true); };
  const handleEditGoal = (goal: Goal) => { setSelectedGoal(goal); setEditModalOpen(true); };
  const handleSaveGoal = (updatedGoal: Goal) => {
    setGoals(prevGoals => prevGoals.map(goal => goal.goal_id === updatedGoal.goal_id ? updatedGoal : goal));
  };
  const handleCreateGoal = async (formData: Omit<Goal, 'goal_id'>) => {
    if (!session?.user?.user_id) return;
    try {
      const payload = { ...formData, user_id: session.user.user_id } as any;
      const response = await axios.post('http://localhost:5000/api/goals', payload);
      const createdGoal: Goal = response.data.goal ?? response.data;
      setGoals(prev => [createdGoal, ...prev]);
      setCreateModalOpen(false);
      // Navigate to plan page for this goal where plans will appear
      router.push(`/plan/${createdGoal.goal_id}`);
    } catch (err) { console.error(err); }
  };
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try { await axios.delete(`http://localhost:5000/api/goals/${goalId}`); setGoals(prev => prev.filter(g => g.goal_id !== goalId)); } 
    catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your goals...</p>
      </div>
    </div>
  );

  return (


        <div className="p-3 md:p-6">
			<div className="max-w-6xl mx-auto">
				{/* Header Section */}
        <div className="mb-8">
					<h1 className="text-3xl font-semibold text-gray-900 mb-2">Your Learning Goals</h1>
					<p className="text-gray-600">Define and organize your learning objectives to stay on track.</p>
				</div>

        {/* Stats Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="grid grid-cols-3 gap-3 sm:flex sm:space-x-4 sm:gap-0">
						<div className="text-center bg-gray-100 rounded-lg p-3">
							<div className="text-2xl text-gray-900">{goals.length}</div>
							<div className="text-sm text-gray-600">Total Goals</div>
						</div>
						<div className="text-center bg-gray-100 rounded-lg p-3">
							<div className="text-2xl text-gray-900">{goals.filter(g => g.status !== 'done').length}</div>
							<div className="text-sm text-gray-600">Active Goals</div>
						</div>
            <div className="text-center bg-gray-100 rounded-lg p-3">
							<div className="text-2xl text-gray-900">{goals.filter(g => g.status === 'done').length}</div>
							<div className="text-sm text-gray-600">Completed</div>
						</div>
					</div>
					<button 
						onClick={() => setCreateModalOpen(true)}
            className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
					>
						Create New Goal
					</button>
				</div>
        
        {/* Error Message */}
				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-600">{error}</p>
					</div>
				)}

        {/* Render filtered goals directly */}
        {filteredGoals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {goals.length === 0 ? 'No goals yet' : 'No goals found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {goals.length === 0 ? 'Start by creating your first learning goal' : 'Try adjusting your search terms'}
            </p>
            <button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {goals.length === 0 ? 'Create Your First Goal' : 'Create New Goal'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map(goal => (
              <div key={goal.goal_id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow h-80 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{getGoalEmoji(goal.title)}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(goal.difficulty_level)}`}>
                    {goal.difficulty_level || 'Not Set'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{goal.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{goal.description || 'No description provided'}</p>
                <div className="text-xs text-gray-500 mb-4">{formatDates(goal.start_date, goal.end_date)}</div>
                <div className="flex space-x-2 mt-auto">
                  <button onClick={() => handleViewGoal(goal)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer">View Details</button>
                  <button onClick={() => handleEditGoal(goal)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer">Edit</button>
                  <button onClick={() => handleDeleteGoal(goal.goal_id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <GoalViewModal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} goal={selectedGoal} />
      <GoalEditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} goal={selectedGoal} onSave={handleSaveGoal} />
      <CreateGoalModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSave={handleCreateGoal} />
    </div>
  );
}

