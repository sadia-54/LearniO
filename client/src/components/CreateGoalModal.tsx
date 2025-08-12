"use client";

import { useState } from "react";

export default function CreateGoalModal({ isOpen, onClose, onSave }: any) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty_level: "Easy",
    start_date: "",
    end_date: ""
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create New Goal</h2>

        <div className="space-y-4">
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
          <select
            name="difficulty_level"
            value={form.difficulty_level}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
        </div>
      </div>
    </div>
  );
}
