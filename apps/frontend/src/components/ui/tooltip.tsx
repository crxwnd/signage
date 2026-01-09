'use client';

import * as React from 'react';

/**
 * Tooltip Components
 * Simple tooltip implementation - placeholder for @radix-ui/react-tooltip
 */

const TooltipProvider = ({
    children,
}: {
    children: React.ReactNode;
    delayDuration?: number;
}) => {
    return <>{children}</>;
};

interface TooltipProps {
    children: React.ReactNode;
}

const Tooltip = ({ children }: TooltipProps) => {
    return <>{children}</>;
};

interface TooltipTriggerProps {
    children: React.ReactNode;
    asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
    ({ children, asChild, ...props }, ref) => {
        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children, { ref, ...props } as React.HTMLAttributes<HTMLElement>);
        }
        return <div ref={ref} {...props}>{children}</div>;
    }
);
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
    side?: 'top' | 'right' | 'bottom' | 'left';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
    (_props, _ref) => {
        // Note: For a fully functional tooltip, consider using @radix-ui/react-tooltip
        // This is a simplified version - returns null as placeholder
        return null;
    }
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
