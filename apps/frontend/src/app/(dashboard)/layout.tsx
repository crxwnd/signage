/**
 * Dashboard Layout
 * Layout for authenticated dashboard pages with collapsible sidebar support
 */

'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

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
      setSidebarCollapsed(saved ? JSON.parse(saved) : false);
    };

    checkCollapsed();
    window.addEventListener('storage', checkCollapsed);

    return () => {
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
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

