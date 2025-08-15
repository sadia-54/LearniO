'use client'

import React from 'react';

interface Goal {
  goal_id: string;
  title: string;
  description?: string;
  difficulty_level: string;
  start_date: string;
  end_date: string;
  status?: string;
}

interface GoalViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export default function GoalViewModal({ isOpen, onClose, goal }: GoalViewModalProps) {
  if (!isOpen || !goal) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
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

  const getGoalEmoji = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('calculus') || lowerTitle.includes('math')) return '🧮';
    if (lowerTitle.includes('python') || lowerTitle.includes('programming')) return '🐍';
    if (lowerTitle.includes('ielts') || lowerTitle.includes('english')) return '📚';
    if (lowerTitle.includes('machine learning') || lowerTitle.includes('ai')) return '🤖';
    if (lowerTitle.includes('speaking') || lowerTitle.includes('presentation')) return '🎤';
    if (lowerTitle.includes('research') || lowerTitle.includes('paper')) return '📝';
    return '🎯';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">{getGoalEmoji(goal.title)}</div>
              <h2 className="text-2xl font-bold text-gray-900">Goal Details</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Goal Information */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
              <p className="text-gray-700 text-lg">{goal.title}</p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">
                {goal.description || 'No description provided'}
              </p>
            </div>

            {/* Difficulty */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Difficulty Level</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(goal.difficulty_level)}`}>
                {goal.difficulty_level || 'Not Set'}
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Date</h3>
                <p className="text-gray-700">{formatDate(goal.start_date)}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">End Date</h3>
                <p className="text-gray-700">{formatDate(goal.end_date)}</p>
              </div>
            </div>

            {/* Status */}
            {goal.status && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {goal.status}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
