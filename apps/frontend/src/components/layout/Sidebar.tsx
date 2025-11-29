/**
 * Sidebar Component
 * Navigation sidebar for dashboard layout
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Monitor, FileVideo, Users, Settings, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Displays',
    href: '/displays',
    icon: Monitor,
  },
  {
    name: 'Content',
    href: '/content',
    icon: FileVideo,
  },
  {
    name: 'Video Demo',
    href: '/video-demo',
    icon: Video,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <h2 className="text-xl font-bold">Signage</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Info */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-xs font-semibold">DH</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">Demo Hotel</p>
            <p className="truncate text-xs text-muted-foreground">demo@hotel.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
