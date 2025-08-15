'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import GoalViewModal from '@/components/GoalViewModal';
import GoalEditModal from '@/components/GoalEditModal';
import CreateGoalModal from '@/components/CreateGoalModal';

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
	const [goals, setGoals] = useState<Goal[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	
	// Modal states
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

	// Fetch goals from database
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
				// Fallback to sample data if API fails
				setGoals(getSampleGoals());
			} finally {
				setLoading(false);
			}
		};

		fetchGoals();
	}, [session?.user?.user_id]);

	// Sample goals as fallback
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

	// Helper function to get difficulty color
	const getDifficultyColor = (difficulty: string): string => {
		switch (difficulty?.toLowerCase()) {
			case 'easy':
				return 'bg-green-100 text-green-800';
			case 'medium':
				return 'bg-orange-100 text-orange-800';
			case 'hard':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	// Helper function to get emoji based on title
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

	// Helper function to format dates
	const formatDates = (startDate: string, endDate: string): string => {
		if (!startDate || !endDate) return 'Dates not set';
		const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		return `${start} - ${end}`;
	};

	// Handle view goal
	const handleViewGoal = (goal: Goal) => {
		setSelectedGoal(goal);
		setViewModalOpen(true);
	};

	// Handle edit goal
	const handleEditGoal = (goal: Goal) => {
		setSelectedGoal(goal);
		setEditModalOpen(true);
	};

	// Handle save edited goal
	const handleSaveGoal = (updatedGoal: Goal) => {
		setGoals(prevGoals => 
			prevGoals.map(goal => 
				goal.goal_id === updatedGoal.goal_id ? updatedGoal : goal
			)
		);
	};

	// Handle create goal
	const handleCreateGoal = async (formData: Omit<Goal, 'goal_id'>) => {
		if (!session?.user?.user_id) {
			alert('You must be logged in to create a goal.');
			return;
		}
		try {
			const payload = { ...formData, user_id: session.user.user_id } as any;
			const response = await axios.post('http://localhost:5000/api/goals', payload);
			const createdGoal: Goal = response.data.goal ?? response.data;
			setGoals(prev => [createdGoal, ...prev]);
			setCreateModalOpen(false);
		} catch (err) {
			console.error('Error creating goal:', err);
			alert('Failed to create goal.');
		}
	};

	// Handle delete goal
	const handleDeleteGoal = async (goalId: string) => {
		if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
			return;
		}

		try {
			await axios.delete(`http://localhost:5000/api/goals/${goalId}`);
			setGoals(prevGoals => prevGoals.filter(goal => goal.goal_id !== goalId));
		} catch (err) {
			console.error('Error deleting goal:', err);
			alert('Failed to delete goal. Please try again.');
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading your goals...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex">
			{/* Left Sidebar - Navigation */}
			<div className="w-80 bg-white border-r border-gray-200 p-6">
				<div className="mb-6">
					<nav className="space-y-2">
						{[
							{ name: "Goals", icon: "🎯" },
							{ name: "Daily Plan", icon: "📅" },
							{ name: "Tasks", icon: "✅" },
							{ name: "Quizzes", icon: "📝" },
							{ name: "Progress", icon: "📊" },
							{ name: "AI Feedback", icon: "🤖" },
							{ name: "Settings", icon: "⚙️" }
						].map((item, index) => (
							<a
								key={index}
								href="#"
								className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
									item.name === "Goals" 
										? "text-gray-600 bg-gray-100" 
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
								}`}
							>
								<span className="text-lg">{item.icon}</span>
								<span className="text-sm font-medium">{item.name}</span>
							</a>
						))}
					</nav>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col">
				{/* Main Content */}
				<div className="flex-1 p-6">
					<div className="max-w-6xl mx-auto">
						{/* Header Section */}
						<div className="mb-8">
							<h1 className="text-3xl font-semibold text-gray-900 mb-2">Your Learning Goals</h1>
							<p className="text-gray-600">Define and organize your learning objectives to stay on track.</p>
						</div>

						{/* Stats Section */}
						<div className="flex items-center justify-between mb-5">
							<div className="flex space-x-4">
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
								className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
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

						{/* Study Goals Grid */}
						{goals.length === 0 ? (
							<div className="text-center py-12">
								<div className="text-6xl mb-4">🎯</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">No goals yet</h3>
								<p className="text-gray-600 mb-6">Start by creating your first learning goal</p>
								<button 
									onClick={() => setCreateModalOpen(true)}
									className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
								>
									Create Your First Goal
								</button>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{goals.map((goal) => (
									<div key={goal.goal_id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
										<div className="flex items-start justify-between mb-4">
											<div className="text-3xl">{getGoalEmoji(goal.title)}</div>
											<span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(goal.difficulty_level)}`}>
												{goal.difficulty_level || 'Not Set'}
											</span>
										</div>
										<h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
										<p className="text-gray-600 text-sm mb-4 line-clamp-3">{goal.description || 'No description provided'}</p>
										<div className="text-xs text-gray-500 mb-4">
											{formatDates(goal.start_date, goal.end_date)}
										</div>
										<div className="flex space-x-2">
											<button 
												onClick={() => handleViewGoal(goal)}
												className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
											>
												View Details
											</button>
											<button 
												onClick={() => handleEditGoal(goal)}
												className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
											>
												Edit
											</button>
											<button 
												onClick={() => handleDeleteGoal(goal.goal_id)}
												className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
											>
												Delete
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Modals */}
			<GoalViewModal
				isOpen={viewModalOpen}
				onClose={() => setViewModalOpen(false)}
				goal={selectedGoal}
			/>
			
			<GoalEditModal
				isOpen={editModalOpen}
				onClose={() => setEditModalOpen(false)}
				goal={selectedGoal}
				onSave={handleSaveGoal}
			/>

			<CreateGoalModal 
				isOpen={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				onSave={handleCreateGoal}
			/>
		</div>
	);
}
