'use client';

/**
 * Collapsible Sidebar with Gradient Design
 * Premium dark sidebar with smooth animations using framer-motion
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  Monitor,
  Film,
  Bell,
  Calendar,
  Layers,
  Radio,
  BarChart3,
  Activity,
  Wifi,
  Users,
  Building,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  FileBarChart,
  Shield,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    defaultOpen: true,
    items: [
      { name: 'Home', href: '/', icon: Home },
    ],
  },
  {
    title: 'Management',
    defaultOpen: true,
    items: [
      { name: 'Displays', href: '/displays', icon: Monitor },
      { name: 'Content', href: '/content', icon: Film },
      { name: 'Alerts', href: '/alerts', icon: Bell },
      { name: 'Schedules', href: '/schedules', icon: Calendar },
      { name: 'Areas', href: '/areas', icon: Layers },
      { name: 'Sync Groups', href: '/sync-groups', icon: Radio },
    ],
  },
  {
    title: 'Analytics',
    defaultOpen: false,
    items: [
      { name: 'Overview', href: '/analytics', icon: BarChart3 },
      { name: 'Display Activity', href: '/analytics/displays', icon: Monitor },
      { name: 'Bandwidth', href: '/analytics/bandwidth', icon: Wifi },
      { name: 'Content Stats', href: '/analytics/content', icon: Film },
    ],
  },
  {
    title: 'Reports & Audit',
    defaultOpen: false,
    items: [
      { name: 'Report Builder', href: '/reports/builder', icon: FileBarChart },
      { name: 'Display Reports', href: '/reports/displays', icon: Monitor },
      { name: 'User Reports', href: '/reports/users', icon: Users },
      { name: 'System Audit', href: '/reports/audit', icon: Shield },
    ],
  },
  {
    title: 'Monitoring',
    defaultOpen: false,
    items: [
      { name: 'Activity Feed', href: '/monitoring/users/activity', icon: Activity },
      { name: 'Login History', href: '/monitoring/users/logins', icon: Clock },
    ],
  },
  {
    title: 'Settings',
    defaultOpen: false,
    items: [
      { name: 'Users', href: '/settings/users', icon: Users },
      { name: 'Hotels', href: '/settings/hotels', icon: Building },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(
    navSections.filter(s => s.defaultOpen).map(s => s.title)
  );

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setIsCollapsed(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    // Dispatch specific event for layout to update immediately
    window.dispatchEvent(new Event('sidebar-toggle'));
    // Keep storage event for consistency (though it usually only fires on OTHER tabs)
    window.dispatchEvent(new Event('storage'));
  }, [isCollapsed]);

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 h-screen z-40',
          'flex flex-col',
          'border-r border-border/50',
          // Gradient background
          'bg-gradient-to-b from-[#1a3a52] via-[#254D6E] to-[#1a3a52]'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B88F69] to-[#96725a] flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">Signage</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-2">
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                {/* Section Header */}
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
                  >
                    <span>{section.title}</span>
                    <motion.div
                      animate={{ rotate: openSections.includes(section.title) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                  </button>
                )}

                {/* Section Items */}
                <AnimatePresence initial={false}>
                  {(isCollapsed || openSections.includes(section.title)) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {section.items.map((item) => {
                        const isActive = pathname === item.href ||
                          (item.href !== '/' && pathname.startsWith(item.href));

                        const linkContent = (
                          <Link
                            href={item.href}
                            prefetch={section.defaultOpen}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                              'hover:bg-white/10',
                              isActive
                                ? 'bg-gradient-to-r from-[#B88F69]/30 to-transparent text-white border-l-2 border-[#B88F69]'
                                : 'text-white/70 hover:text-white'
                            )}
                          >
                            <item.icon className={cn(
                              'h-5 w-5 flex-shrink-0',
                              isActive && 'text-[#B88F69]'
                            )} />
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm font-medium"
                              >
                                {item.name}
                              </motion.span>
                            )}
                            {!isCollapsed && item.badge && (
                              <span className="ml-auto bg-[#B88F69] text-white text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );

                        if (isCollapsed) {
                          return (
                            <Tooltip key={item.href}>
                              <TooltipTrigger asChild>
                                {linkContent}
                              </TooltipTrigger>
                              <TooltipContent side="right" className="bg-[#254D6E] text-white border-[#B88F69]/30">
                                {item.name}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return <div key={item.href}>{linkContent}</div>;
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          {/* Theme Toggle Row */}
          <div className={cn(
            'flex items-center mb-3',
            isCollapsed ? 'justify-center' : 'justify-end'
          )}>
            <ThemeToggle />
          </div>

          <div className={cn(
            'flex items-center gap-3',
            isCollapsed && 'justify-center'
          )}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B88F69] to-[#96725a] flex items-center justify-center text-white font-semibold">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-white/50 truncate">{user?.role?.replace('_', ' ')}</p>
              </motion.div>
            )}
            {!isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-white/50 hover:text-white hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Logout</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
