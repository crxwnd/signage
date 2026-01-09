import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-[350px] rounded-xl" />
                <Skeleton className="h-[350px] rounded-xl" />
            </div>

            {/* Table */}
            <Skeleton className="h-[300px] rounded-xl" />
        </div>
    );
}
