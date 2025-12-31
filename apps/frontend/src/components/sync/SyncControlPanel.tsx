'use client';

/**
 * SyncControlPanel Component
 * Panel for controlling sync group playback with content selection
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Play, Video } from 'lucide-react';
import { useSyncGroupControls } from '@/hooks/useSyncGroups';
import { useContent } from '@/hooks/useContent';

interface SyncControlPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    groupName: string;
}

export function SyncControlPanel({
    open,
    onOpenChange,
    groupId,
    groupName,
}: SyncControlPanelProps) {
    const [selectedContentId, setSelectedContentId] = useState<string>('');

    const controls = useSyncGroupControls(groupId);
    const { contents = [], isLoading: contentLoading } = useContent();

    // Filter to only show video content that is ready
    const videoContent = contents.filter(
        (item) => item.type === 'VIDEO' && item.status === 'READY'
    );

    const handleStartPlayback = async () => {
        if (!selectedContentId) return;

        try {
            await controls.start.mutateAsync({ contentId: selectedContentId });
            onOpenChange(false);
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        Start Playback
                    </DialogTitle>
                    <DialogDescription>
                        Select content to play on group &quot;{groupName}&quot;
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="content">Select Video Content</Label>

                        {contentLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : videoContent.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-2 border rounded-md">
                                No video content available. Upload videos first.
                            </p>
                        ) : (
                            <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a video..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {videoContent.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            <div className="flex items-center gap-2">
                                                <Video className="h-4 w-4 text-muted-foreground" />
                                                <span>{item.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStartPlayback}
                        disabled={!selectedContentId || controls.start.isPending}
                    >
                        {controls.start.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Playback
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
