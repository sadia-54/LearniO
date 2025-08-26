'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { useSearch } from '@/context/SearchContext';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { searchTerm, setSearchTerm } = useSearch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
    <nav className="bg-teal-500 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Top row */}
        <div className="flex items-center justify-between">
          {/* Left: Logo + desktop nav */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Mobile hamburger */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-teal-600 md:hidden"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <Logo />

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:gap-6">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive ? 'text-white border-b-2 border-white pb-1' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: search (desktop), profile, logout, mobile search icon */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop search */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search your study goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-white/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/80 focus:border-transparent bg-transparent text-white placeholder-white/80"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Mobile search icon */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-teal-600"
              aria-label="Toggle search"
              onClick={() => setMobileSearchOpen((v) => !v)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
            </button>

            {/* Profile */}
            <div className="hidden sm:flex items-center gap-3">
              {session.user?.image ? (
                <Image src={session.user.image} alt="Profile" width={32} height={32} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-white/30 rounded-full" />
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 md:px-4 py-2 text-white hover:bg-teal-600 rounded-lg transition-colors font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile search bar (collapsible) */}
        {mobileSearchOpen && (
          <div className="mt-3 md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Search your study goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/80 focus:border-transparent bg-transparent text-white placeholder-white/80"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Mobile nav panel */}
        {mobileOpen && (
          <div className="mt-3 md:hidden border-t border-white/20 pt-3">
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`text-sm font-medium rounded-md px-3 py-2 text-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
