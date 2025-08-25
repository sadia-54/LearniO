'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer when route changes on mobile
  useEffect(() => { setOpen(false); }, [pathname]);

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
    <>
      {/* Static sidebar on md+ */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 p-6 min-h-screen">
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

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-40 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6 transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Menu</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1 rounded hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.061L12 11.646l-4.715 4.715a.75.75 0 11-1.06-1.061l4.714-4.714-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href === '/home' && pathname === '/') ||
                (item.href !== '/home' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-gray-700 bg-gray-100'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
    </>
  );
}
