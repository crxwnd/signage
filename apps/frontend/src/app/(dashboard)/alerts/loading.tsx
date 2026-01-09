import { Skeleton } from '@/components/ui/skeleton';

export default function AlertsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>

            {/* Filters */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* Alerts list */}
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
