// src/components/Logo.tsx
'use client'

import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center">
      <div className="px-4 py-2 rounded-lg shadow-none bg-transparent">
        <span className="font-extrabold text-2xl tracking-wide text-white">
          LearniO <span className="text-teal-700">AI</span>
        </span>
      </div>
    </div>
  );
}

