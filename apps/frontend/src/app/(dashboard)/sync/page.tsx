'use client';

/**
 * Sync Groups Page
 * Manage synchronized display groups
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Radio, Loader2 } from 'lucide-react';
import { useSyncGroups } from '@/hooks/useSyncGroups';
import { SyncGroupCard } from '@/components/sync/SyncGroupCard';
import { CreateSyncGroupModal } from '@/components/sync/CreateSyncGroupModal';
import { SyncControlPanel } from '@/components/sync/SyncControlPanel';

export default function SyncPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedGroupForContent, setSelectedGroupForContent] = useState<{ id: string; name: string } | null>(null);
    const { data: groups = [], isLoading, error } = useSyncGroups();

    const handleSelectContent = (groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (group) {
            setSelectedGroupForContent({ id: group.id, name: group.name });
        }
    };

    return (
        <div className="container mx-auto py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Radio className="h-6 w-6 text-primary" />
                        Sync Groups
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage synchronized display groups for coordinated playback
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-destructive">
                            Failed to load sync groups: {error.message}
                        </p>
                    </CardContent>
                </Card>
            ) : groups.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Sync Groups</CardTitle>
                        <CardDescription>
                            Create a sync group to synchronize playback across multiple displays.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Group
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <SyncGroupCard
                            key={group.id}
                            group={group}
                            onSelectContent={handleSelectContent}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <CreateSyncGroupModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
            />

            {/* Content Selection Panel */}
            {selectedGroupForContent && (
                <SyncControlPanel
                    open={!!selectedGroupForContent}
                    onOpenChange={(open) => !open && setSelectedGroupForContent(null)}
                    groupId={selectedGroupForContent.id}
                    groupName={selectedGroupForContent.name}
                />
            )}
        </div>
    );
}

