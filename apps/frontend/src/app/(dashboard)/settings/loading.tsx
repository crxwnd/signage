import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Tabs */}
            <Skeleton className="h-10 w-80" />

            {/* Settings form */}
            <div className="space-y-6">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
            </div>
        </div>
    );
}
