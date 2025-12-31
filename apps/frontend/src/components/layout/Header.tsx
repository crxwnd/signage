/**
 * Header Component
 * Premium glass header with connection status and user menu
 */

'use client';

import { Bell, Menu, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onMenuClick?: () => void;
}

function getUserInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30">
      {/* Left Section - Mobile Menu + Title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Digital Signage
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Management System
          </p>
        </div>
      </div>

      {/* Right Section - Connection Status + Notifications + User Menu */}
      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <ConnectionStatus />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* Notification badge with subtle pulse */}
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-secondary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-secondary"></span>
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white">
                <span className="text-xs font-semibold">
                  {user ? getUserInitials(user.name) : 'GU'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass animate-slideDown">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || 'Guest User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'Not logged in'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
