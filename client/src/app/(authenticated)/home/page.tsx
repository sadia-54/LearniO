'use client'

import React, { useState, useEffect } from "react";
import CreateGoalModal from "@/components/CreateGoalModal";
import axios, { AxiosError } from "axios";
import { useSession } from "next-auth/react";

const backendUrl = "http://localhost:5000";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveGoal = async (goalData: any) => {
    if (status !== "authenticated") {
      console.error("User not authenticated");
      return;
    }

    // Get user_id from session (adjust if your session.user uses different key)
    const userId = session?.user?.user_id || session?.user?.email;


    if (!userId) {
      console.error("User ID not found in session");
      return;
    }

    // Add user_id to goalData
    const goalDataWithUser = { ...goalData, user_id: userId };

    try {
      const res = await axios.post(`${backendUrl}/api/goals`, goalDataWithUser);
      if (res.status === 201) {
        console.log("✅ Goal created successfully");
      }
    } catch (error) {
      console.error("❌ Failed to create goal", error);

      if (error instanceof AxiosError) {
        console.error("Error status:", error.response?.status);
        console.error("Error data:", error.response?.data);
        console.error("Error message:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };



  const studyGoals = [
    {
      id: 1,
      title: "Master Calculus I",
      description: "Comprehensive study of differential and integral calculus, focusing on applications in physics and engineering.",
      image: "🧮",
      dates: "Sep 1, 2024 - Dec 15, 2024",
      difficulty: "Hard",
      difficultyColor: "bg-red-100 text-red-800"
    },
    {
      id: 2,
      title: "Learn Python Basics",
      description: "Introduction to Python programming language, covering syntax, data structures, control flow, and basic algorithms.",
      image: "🐍",
      dates: "Oct 1, 2024 - Nov 30, 2024",
      difficulty: "Easy",
      difficultyColor: "bg-green-100 text-green-800"
    },
    {
      id: 3,
      title: "Prepare for IELTS",
      description: "Intensive preparation for the International English Language Testing System (IELTS), focusing on all four skills.",
      image: "📚",
      dates: "Aug 15, 2024 - Sep 30, 2024",
      difficulty: "Medium",
      difficultyColor: "bg-orange-100 text-orange-800"
    },
    {
      id: 4,
      title: "Deep Dive into Machine Learning",
      description: "Advanced topics in machine learning, including neural networks, deep learning frameworks, and practical applications.",
      image: "🤖",
      dates: "Jan 1, 2025 - Jun 30, 2025",
      difficulty: "Hard",
      difficultyColor: "bg-red-100 text-red-800"
    },
    {
      id: 5,
      title: "Improve Public Speaking",
      description: "Develop confidence and skill in public speaking through structured practice, feedback sessions, and real-world experience.",
      image: "🎤",
      dates: "Nov 1, 2024 - Feb 28, 2025",
      difficulty: "Easy",
      difficultyColor: "bg-green-100 text-green-800"
    },
    {
      id: 6,
      title: "Research Paper Writing",
      description: "Learn the process of writing academic research papers, from literature review to citation and publication.",
      image: "📝",
      dates: "Oct 15, 2024 - Jan 31, 2025",
      difficulty: "Medium",
      difficultyColor: "bg-orange-100 text-orange-800"
    }
  ];



  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Daily Plan */}
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
            <div className="flex items-center justify-between mb-5 ">
              <div className="flex space-x-4">
                <div className="text-center bg-gray-100 rounded-lg p-3">
                  <div className="text-2xl text-gray-900 ">12</div>
                  <div className="text-sm text-gray-600">Total Goals</div>
                </div>
                <div className="text-center bg-gray-100 rounded-lg p-3">
                  <div className="text-2xl text-gray-900">7</div>
                  <div className="text-sm text-gray-600">Active Goals</div>
                </div>
                <div className="text-center bg-gray-100 rounded-lg p-3">
                  <div className="text-2xl text-gray-900">5</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
              <button
              onClick={() => setIsModalOpen(true)} 
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer">
                Create New Goal
              </button>
            </div>
            
            {/* Modal */}
            <CreateGoalModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleSaveGoal}
            />

            {/* Study Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyGoals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{goal.image}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${goal.difficultyColor}`}>
                      {goal.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{goal.description}</p>
                  <div className="text-xs text-gray-500 mb-4">{goal.dates}</div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors">
                      Edit
                    </button>
                    <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
