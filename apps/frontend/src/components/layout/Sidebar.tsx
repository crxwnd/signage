/**
 * Sidebar Component
 * Premium dark sidebar with collapsible sections (Slack-style)
 * Implements role-based navigation filtering
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Monitor,
  Layers,
  FileVideo,
  Users,
  Settings,
  LogOut,
  User,
  Building2,
  Radio,
  BarChart3,
  Wifi,
  Film,
  Calendar,
  Bell,
  Activity,
  Clock,
  Shield,
  UserCheck,
  FileText,
  Laptop,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarSection } from './SidebarSection';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

type UserRole = 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  requiredRoles?: UserRole[];
}

// Navigation grouped by section
const navSections = {
  dashboard: {
    title: 'Dashboard',
    items: [
      { name: 'Home', href: '/home', icon: Home },
    ],
  },
  management: {
    title: 'Management',
    items: [
      { name: 'Displays', href: '/displays', icon: Monitor },
      { name: 'Content', href: '/content', icon: FileVideo },
      { name: 'Alerts', href: '/alerts', icon: Bell, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Schedules', href: '/schedules', icon: Calendar, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Areas', href: '/areas', icon: Layers, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Sync Groups', href: '/sync', icon: Radio, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
    ],
  },
  analytics: {
    title: 'Analytics',
    items: [
      { name: 'Overview', href: '/analytics', icon: BarChart3, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Display Activity', href: '/analytics/displays', icon: Monitor, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Display History', href: '/analytics/displays/history', icon: Clock, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER'] as UserRole[] },
      { name: 'Bandwidth', href: '/analytics/bandwidth', icon: Wifi, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Content Stats', href: '/analytics/content', icon: Film, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
    ],
  },
  userMonitoring: {
    title: 'User Monitoring',
    items: [
      { name: 'Overview', href: '/monitoring/users', icon: Users, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Activity Feed', href: '/monitoring/users/activity', icon: Activity, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Login History', href: '/monitoring/users/logins', icon: Clock, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'User Performance', href: '/monitoring/users/performance', icon: UserCheck, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Access & Permissions', href: '/monitoring/users/access', icon: Shield, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Audit Trail', href: '/monitoring/audit', icon: FileText, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Active Sessions', href: '/monitoring/sessions', icon: Laptop, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
    ],
  },
  settings: {
    title: 'Settings',
    items: [
      { name: 'Users', href: '/users', icon: Users, requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'] as UserRole[] },
      { name: 'Hotels', href: '/hotels', icon: Building2, requiredRoles: ['SUPER_ADMIN'] as UserRole[] },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
};

function getUserInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN': return 'Super Admin';
    case 'HOTEL_ADMIN': return 'Hotel Admin';
    case 'AREA_MANAGER': return 'Area Manager';
    default: return role;
  }
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'HOTEL_ADMIN': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'AREA_MANAGER': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  // Filter nav items based on role
  const filterItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.requiredRoles) return true;
      if (isLoading || !user) return false;
      return item.requiredRoles.includes(user.role as UserRole);
    });
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm font-medium",
          "transition-all duration-150",
          isActive
            ? "bg-sidebar-active text-white"
            : "text-gray-400 hover:text-white hover:bg-sidebar-hover"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/5">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Signage
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Dashboard Section */}
        <SidebarSection title={navSections.dashboard.title}>
          {navSections.dashboard.items.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </SidebarSection>

        {/* Management Section */}
        {filterItems(navSections.management.items).length > 0 && (
          <SidebarSection title={navSections.management.title}>
            {filterItems(navSections.management.items).map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </SidebarSection>
        )}

        {/* Analytics Section */}
        {filterItems(navSections.analytics.items).length > 0 && (
          <SidebarSection title={navSections.analytics.title}>
            {filterItems(navSections.analytics.items).map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </SidebarSection>
        )}

        {/* User Monitoring Section */}
        {filterItems(navSections.userMonitoring.items).length > 0 && (
          <SidebarSection title={navSections.userMonitoring.title}>
            {filterItems(navSections.userMonitoring.items).map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </SidebarSection>
        )}

        {/* Settings Section */}
        {filterItems(navSections.settings.items).length > 0 && (
          <SidebarSection title={navSections.settings.title}>
            {filterItems(navSections.settings.items).map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </SidebarSection>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-white/5 p-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2",
                "text-sm transition-all duration-150",
                "hover:bg-sidebar-hover"
              )}>
                {/* Avatar */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white">
                  <span className="text-xs font-semibold">
                    {getUserInitials(user.name)}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 overflow-hidden text-left">
                  <p className="truncate text-sm font-medium text-white">
                    {user.name}
                  </p>
                  <span className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                    getRoleColor(user.role)
                  )}>
                    {formatRole(user.role)}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 glass-dark animate-slideDown"
              sideOffset={8}
            >
              <DropdownMenuLabel className="text-gray-300">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-sidebar-hover">
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-sidebar-hover">
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Not logged in</p>
          </div>
        )}
      </div>
    </aside>
  );
}
