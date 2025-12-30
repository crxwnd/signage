/**
 * Sidebar Component
 * Navigation sidebar for dashboard layout
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
  Video,
  LogOut,
  User,
  Building2,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from '@/components/ui';

type UserRole = 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can see this item. If undefined, all roles can see it */
  requiredRoles?: UserRole[];
}

/**
 * Navigation items with role requirements
 */
const navigation: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    // All roles
  },
  {
    name: 'Displays',
    href: '/displays',
    icon: Monitor,
    // All roles
  },
  {
    name: 'Áreas',
    href: '/areas',
    icon: Layers,
    requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'], // AREA_MANAGER cannot manage areas
  },
  {
    name: 'Content',
    href: '/content',
    icon: FileVideo,
    // All roles can view content
  },
  {
    name: 'Video Demo',
    href: '/video-demo',
    icon: Video,
    // All roles
  },
  {
    name: 'Sync Groups',
    href: '/sync',
    icon: Radio,
    requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'], // Only admins can manage sync
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    requiredRoles: ['SUPER_ADMIN', 'HOTEL_ADMIN'], // Only admins can manage users
  },
  {
    name: 'Hotels',
    href: '/hotels',
    icon: Building2,
    requiredRoles: ['SUPER_ADMIN'], // Only super admin can manage hotels
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    // All roles
  },
];

/**
 * Get user initials from name
 */
function getUserInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Format role for display
 */
function formatRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'HOTEL_ADMIN':
      return 'Hotel Admin';
    case 'AREA_MANAGER':
      return 'Area Manager';
    default:
      return role;
  }
}

/**
 * Get badge variant for role
 */
function getRoleBadgeVariant(role: string): 'destructive' | 'default' | 'secondary' {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'destructive'; // Red
    case 'HOTEL_ADMIN':
      return 'default'; // Blue
    case 'AREA_MANAGER':
      return 'secondary'; // Gray
    default:
      return 'secondary';
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  // Filter navigation items based on user role
  // When user is null or loading, show only items without role requirements (base items)
  const filteredNavigation = navigation.filter((item) => {
    // If no role requirement, show to everyone (including when not logged in)
    if (!item.requiredRoles) {
      return true;
    }
    // If user is loading or not logged in, hide role-restricted items but keep base items
    if (isLoading || !user) {
      return false;
    }
    // Check if user's role is in the required roles
    return item.requiredRoles.includes(user.role as UserRole);
  });

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <h2 className="text-xl font-bold">Signage</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
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
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-xs font-semibold">
                    {getUserInitials(user.name)}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden text-left">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <Badge
                    variant={getRoleBadgeVariant(user.role)}
                    className="mt-0.5 text-[10px] px-1.5 py-0"
                  >
                    {formatRole(user.role)}
                  </Badge>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-muted-foreground">
                Not logged in
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

