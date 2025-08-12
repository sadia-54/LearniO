'use client'

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigationItems = [
    { name: "Goals", href: "/home" },
    { name: "Plan", href: "/plan" },
    { name: "Tasks", href: "/tasks" },
    { name: "Quizzes", href: "/quizzes" },
    { name: "Progress", href: "/progress" },
    { name: "Feedback", href: "/feedback" }
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  if (!session) {
    return null; // Don't show navbar if not logged in
  }

  return (
    <nav className="bg-teal-500 border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Logo />
          
          {/* Navigation Items */}
          <div className="flex space-x-6">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive 
                      ? "text-white border-b-2 border-teal-600 pb-1" 
                      : "text-white hover:text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side - Search, User Profile, Logout */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search your study goals..."
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-transparent bg-transparent text-white placeholder-white"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
               
              </div>
            )}
           
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-white hover:text-white hover:bg-teal-600 rounded-lg transition-colors cursor-pointer font-bold"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
