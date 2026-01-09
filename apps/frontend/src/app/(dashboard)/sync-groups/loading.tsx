import { Skeleton } from '@/components/ui/skeleton';

export default function SyncGroupsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>

            {/* Groups list */}
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
