/**
 * Dashboard Layout
 * Layout for authenticated dashboard pages with collapsible sidebar support
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';

// Minimal loading fallback for Suspense
function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 md:grid-cols-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar collapsed state changes
  useEffect(() => {
    const checkCollapsed = () => {
      const saved = localStorage.getItem('sidebar-collapsed');
      // Only update if value exists to prevent hydration mismatch default flicker
      if (saved) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    };

    // Initial check
    checkCollapsed();

    // Listen for custom event from Sidebar component
    const handleSidebarToggle = () => checkCollapsed();
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('storage', checkCollapsed);

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('storage', checkCollapsed);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Always visible on desktop */}
      <Sidebar />

      {/* Main content area with dynamic margin */}
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out pl-0 md:pl-[280px] ${
          sidebarCollapsed ? 'md:pl-[80px]' : ''
        }`}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Suspense boundary for streaming and loading states */}
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}


