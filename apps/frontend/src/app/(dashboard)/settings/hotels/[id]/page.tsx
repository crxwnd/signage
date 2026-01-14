'use client';

/**
 * Hotel Details Page
 * View hotel information, statistics, and manage related resources
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    Building,
    Monitor,
    Users,
    Layers,
    FileVideo,
    MapPin,
    Calendar,
    Edit,
    ExternalLink,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface HotelDetails {
    id: string;
    name: string;
    address: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        displays: number;
        users: number;
        areas: number;
        contents: number;
    };
    displays?: Array<{
        id: string;
        name: string;
        status: string;
        area?: { name: string };
    }>;
    users?: Array<{
        id: string;
        email: string;
        name: string;
        role: string;
    }>;
    areas?: Array<{
        id: string;
        name: string;
        _count?: { displays: number };
    }>;
}

export default function HotelDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const hotelId = params.id as string;
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch hotel details
    const { data: hotelData, isLoading, error } = useQuery({
        queryKey: ['hotel', hotelId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/hotels/${hotelId}?stats=true`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Hotel not found');
                throw new Error('Failed to fetch hotel');
            }
            return res.json();
        },
        enabled: !!hotelId && user?.role === 'SUPER_ADMIN',
    });

    // Fetch displays for this hotel
    const { data: displaysData } = useQuery({
        queryKey: ['hotel-displays', hotelId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/displays?hotelId=${hotelId}`);
            if (!res.ok) throw new Error('Failed to fetch displays');
            return res.json();
        },
        enabled: !!hotelId && activeTab === 'displays',
    });

    // Fetch users for this hotel
    const { data: usersData } = useQuery({
        queryKey: ['hotel-users', hotelId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/users?hotelId=${hotelId}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
        enabled: !!hotelId && activeTab === 'users',
    });

    // Fetch areas for this hotel
    const { data: areasData } = useQuery({
        queryKey: ['hotel-areas', hotelId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/areas?hotelId=${hotelId}`);
            if (!res.ok) throw new Error('Failed to fetch areas');
            return res.json();
        },
        enabled: !!hotelId && activeTab === 'areas',
    });

    const hotel: HotelDetails | undefined = hotelData?.data?.hotel;
    const displays = displaysData?.data?.displays || [];
    const users = usersData?.data?.users || [];
    const areas = areasData?.data?.areas || [];

    // Access control
    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground mt-2">Only Super Admins can view hotel details</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <HotelDetailsSkeleton />;
    }

    if (error || !hotel) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">Hotel Not Found</h2>
                    <p className="text-muted-foreground mt-2">The hotel you are looking for does not exist</p>
                    <Button className="mt-4" onClick={() => router.push('/settings/hotels')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Hotels
                    </Button>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Displays', value: hotel._count?.displays || 0, icon: Monitor, color: 'text-blue-500' },
        { label: 'Users', value: hotel._count?.users || 0, icon: Users, color: 'text-green-500' },
        { label: 'Areas', value: hotel._count?.areas || 0, icon: Layers, color: 'text-purple-500' },
        { label: 'Content', value: hotel._count?.contents || 0, icon: FileVideo, color: 'text-orange-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/settings/hotels')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Badge variant="outline" className="text-xs">
                            Hotel
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Building className="h-8 w-8" />
                        {hotel.name}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{hotel.address}</span>
                    </div>
                </div>
                <Button variant="outline" onClick={() => router.push('/settings/hotels')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Hotel
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                </div>
                                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="displays">Displays</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="areas">Areas</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Hotel Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Hotel ID</p>
                                        <p className="font-mono text-xs">{hotel.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Created</p>
                                        <p className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(hotel.createdAt), 'PPP')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/displays?hotelId=${hotelId}`}>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Monitor className="h-4 w-4 mr-2" />
                                        View Displays
                                        <ExternalLink className="h-3 w-3 ml-auto" />
                                    </Button>
                                </Link>
                                <Link href={`/settings/users?hotelId=${hotelId}`}>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Users className="h-4 w-4 mr-2" />
                                        Manage Users
                                        <ExternalLink className="h-3 w-3 ml-auto" />
                                    </Button>
                                </Link>
                                <Link href={`/areas?hotelId=${hotelId}`}>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Layers className="h-4 w-4 mr-2" />
                                        Manage Areas
                                        <ExternalLink className="h-3 w-3 ml-auto" />
                                    </Button>
                                </Link>
                                <Link href={`/content?hotelId=${hotelId}`}>
                                    <Button variant="outline" className="w-full justify-start">
                                        <FileVideo className="h-4 w-4 mr-2" />
                                        View Content
                                        <ExternalLink className="h-3 w-3 ml-auto" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Displays Tab */}
                <TabsContent value="displays" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Displays ({displays.length})</CardTitle>
                            <CardDescription>All displays assigned to this hotel</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {displays.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No displays found for this hotel</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {displays.map((display: any) => (
                                        <div
                                            key={display.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Monitor className="h-5 w-5" />
                                                <div>
                                                    <p className="font-medium">{display.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {display.area?.name || 'No area assigned'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={display.status === 'ONLINE' ? 'default' : 'secondary'}
                                                    className={display.status === 'ONLINE' ? 'bg-green-500' : ''}
                                                >
                                                    {display.status}
                                                </Badge>
                                                <Link href={`/displays/${display.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Users ({users.length})</CardTitle>
                            <CardDescription>Users with access to this hotel</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {users.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No users found for this hotel</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {users.map((user: any) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name || user.email}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline">{user.role}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Areas Tab */}
                <TabsContent value="areas" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Areas ({areas.length})</CardTitle>
                            <CardDescription>Physical areas within this hotel</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {areas.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No areas defined for this hotel</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {areas.map((area: any) => (
                                        <div
                                            key={area.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Layers className="h-5 w-5" />
                                                <div>
                                                    <p className="font-medium">{area.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {area._count?.displays || 0} displays
                                                    </p>
                                                </div>
                                            </div>
                                            <Link href={`/areas/${area.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function HotelDetailsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-96" />
                <Skeleton className="h-5 w-64" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-64" />
        </div>
    );
}
