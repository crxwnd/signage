'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ScrollArea Component
 * A simple scrollable container with custom styling
 */
interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'relative overflow-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
