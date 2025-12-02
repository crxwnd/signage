/**
 * Auth Layout
 * Simplified layout for authentication pages (login, register)
 * No sidebar or navigation - just centered content
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Hotel Signage',
  description: 'Sign in to access your digital signage dashboard',
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />

      {/* Logo/Brand */}
      <div className="relative">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Hotel Signage
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative">{children}</main>

      {/* Footer */}
      <footer className="relative mt-8 pb-8 text-center text-sm text-slate-600 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} Hotel Signage. All rights reserved.</p>
      </footer>
    </div>
  );
}
