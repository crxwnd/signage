'use client';

/**
 * CreateSyncGroupModal Component
 * Modal for creating new sync groups
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSyncGroup } from '@/hooks/useSyncGroups';
import { useDisplays } from '@/hooks/useDisplays';
import { Loader2, Check } from 'lucide-react';

interface CreateSyncGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateSyncGroupModal({ open, onOpenChange }: CreateSyncGroupModalProps) {
    const [name, setName] = useState('');
    const [selectedDisplays, setSelectedDisplays] = useState<string[]>([]);

    const { displays = [], isLoading: displaysLoading } = useDisplays();
    const createMutation = useCreateSyncGroup();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || selectedDisplays.length < 2) return;

        try {
            await createMutation.mutateAsync({
                name: name.trim(),
                displayIds: selectedDisplays,
            });

            // Reset and close
            setName('');
            setSelectedDisplays([]);
            onOpenChange(false);
        } catch {
            // Error handled by mutation
        }
    };

    const toggleDisplay = (displayId: string) => {
        setSelectedDisplays(prev =>
            prev.includes(displayId)
                ? prev.filter(id => id !== displayId)
                : [...prev, displayId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Sync Group</DialogTitle>
                        <DialogDescription>
                            Create a group of displays that will play content in sync.
                            Select at least 2 displays.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Group name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Group Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Lobby Screens"
                                required
                            />
                        </div>

                        {/* Display selection */}
                        <div className="grid gap-2">
                            <Label>Select Displays ({selectedDisplays.length} selected)</Label>

                            {displaysLoading ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : displays.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No displays available</p>
                            ) : (
                                <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-3">
                                    {displays.map((display) => (
                                        <div
                                            key={display.id}
                                            className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                                            onClick={() => toggleDisplay(display.id)}
                                        >
                                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedDisplays.includes(display.id)
                                                ? 'bg-primary border-primary'
                                                : 'border-gray-300'
                                                }`}>
                                                {selectedDisplays.includes(display.id) && (
                                                    <Check className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{display.name}</p>
                                                <p className="text-xs text-muted-foreground">{display.location}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${display.status === 'ONLINE'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {display.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
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
                            type="submit"
                            disabled={!name.trim() || selectedDisplays.length < 2 || createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                'Create Group'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
