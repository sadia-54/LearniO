import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { SearchProvider } from '@/context/SearchContext';
import QueryProvider from '@/providers/QueryProvider';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout stays mostly the same; Sidebar handles its own mobile drawer state
  return (
    <QueryProvider>
      <SearchProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-3 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </SearchProvider>
    </QueryProvider>
  );
}
