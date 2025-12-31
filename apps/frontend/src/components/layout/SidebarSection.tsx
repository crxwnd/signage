'use client';

/**
 * SidebarSection Component
 * Collapsible section for grouping navigation items
 * Slack-style with smooth animations
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function SidebarSection({
    title,
    children,
    defaultOpen = true
}: SidebarSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-1">
            {/* Section Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between w-full px-3 py-2",
                    "text-xs font-semibold uppercase tracking-wider",
                    "text-gray-400 hover:text-gray-200",
                    "transition-colors duration-150"
                )}
            >
                <span>{title}</span>
                <ChevronDown
                    className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Section Content */}
            <div
                className={cn(
                    "overflow-hidden transition-all duration-200 ease-out",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="space-y-0.5 pb-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
