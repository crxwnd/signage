import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>

            {/* Main content skeleton */}
            <Skeleton className="h-[400px] rounded-xl" />
        </div>
    );
}
