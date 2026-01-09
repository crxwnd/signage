import { Skeleton } from '@/components/ui/skeleton';

export default function ContentLoading() {
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* Tabs */}
            <Skeleton className="h-10 w-64" />

            {/* Filters */}
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1 max-w-md" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Content grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
