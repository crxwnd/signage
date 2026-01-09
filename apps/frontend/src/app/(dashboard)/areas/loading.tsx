import { Skeleton } from '@/components/ui/skeleton';

export default function AreasLoading() {
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-28" />
            </div>

            {/* Search */}
            <Skeleton className="h-10 w-full max-w-md" />

            {/* Areas grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
