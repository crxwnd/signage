'use client';

/**
 * StatsCard Component
 * Displays a single statistic with icon and label
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'success' | 'warning' | 'error';
}

const variantStyles = {
    default: 'text-primary',
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
};

export function StatsCard({
    title,
    value,
    icon,
    description,
    variant = 'default',
}: StatsCardProps) {
    return (
        <Card className="glass card-hover">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className={cn('text-3xl font-bold', variantStyles[variant])}>
                            {value}
                        </p>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                    <div className={cn('p-3 rounded-xl bg-muted/50', variantStyles[variant])}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
