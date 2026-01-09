import { Skeleton } from '@/components/ui/skeleton';

export default function SchedulesLoading() {
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* View toggle and filters */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            {/* Calendar/List skeleton */}
            <Skeleton className="h-[500px] rounded-xl" />
        </div>
    );
}
