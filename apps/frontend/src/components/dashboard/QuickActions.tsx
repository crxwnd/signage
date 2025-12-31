'use client';

/**
 * QuickActions Component
 * Quick action buttons for common tasks
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Monitor, Film, Radio, Upload } from 'lucide-react';

export function QuickActions() {
    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Link href="/displays?action=create" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Display
                    </Button>
                </Link>

                <Link href="/content?action=upload" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Content
                    </Button>
                </Link>

                <Link href="/displays" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Monitor className="h-4 w-4 mr-2" />
                        View All Displays
                    </Button>
                </Link>

                <Link href="/content" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Film className="h-4 w-4 mr-2" />
                        Manage Content
                    </Button>
                </Link>

                <Link href="/sync" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Radio className="h-4 w-4 mr-2" />
                        Sync Groups
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
