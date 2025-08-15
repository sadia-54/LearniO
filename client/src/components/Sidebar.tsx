'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navigationItems = [
    { name: "Goals", icon: "🎯", href: "/home" },
    { name: "Daily Plan", icon: "📅", href: "/plan" },
    { name: "Tasks", icon: "✅", href: "/tasks" },
    { name: "Quizzes", icon: "📝", href: "/quizzes" },
    { name: "Progress", icon: "📊", href: "/progress" },
    { name: "AI Feedback", icon: "🤖", href: "/feedback" },
    { name: "Settings", icon: "⚙️", href: "/settings" }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 min-h-screen">
      <div className="mb-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            // Check if current path matches the navigation item
            const isActive = pathname === item.href || 
                           (item.href === '/home' && pathname === '/') ||
                           (item.href !== '/home' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? "text-gray-700 bg-gray-100 " 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
