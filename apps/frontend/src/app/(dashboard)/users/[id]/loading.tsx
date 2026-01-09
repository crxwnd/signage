import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function UserProfileLoading() {
    return (
        <div className="space-y-6 animate-in fade-in-50">
            <Skeleton className="h-10 w-24" />
            <Card>
                <Skeleton className="h-32 w-full" />
                <CardContent className="pt-6">
                    <div className="flex gap-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                            <div className="grid grid-cols-4 gap-4 mt-6">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-20" />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-64" />
                <Skeleton className="h-64 md:col-span-2" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}
