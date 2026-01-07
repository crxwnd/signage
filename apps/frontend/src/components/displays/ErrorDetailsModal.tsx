'use client';

/**
 * ErrorDetailsModal Component
 * Shows detailed error information for a display
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertTriangle,
    RefreshCw,
    Copy,
    Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// Error code definitions
export const ErrorCodeMessages: Record<string, string> = {
    CONNECTION_LOST: 'Lost connection to server',
    CONTENT_LOAD_FAILED: 'Failed to load content',
    STREAM_ERROR: 'Video streaming error',
    AUTHENTICATION_FAILED: 'Authentication failed',
    STORAGE_FULL: 'Local storage is full',
    NETWORK_TIMEOUT: 'Network request timed out',
    INVALID_CONTENT: 'Content format not supported',
    HARDWARE_ERROR: 'Hardware malfunction detected',
    UNKNOWN: 'An unknown error occurred',
};

export const ErrorCodeSolutions: Record<string, string> = {
    CONNECTION_LOST: 'Check network connection and server status',
    CONTENT_LOAD_FAILED: 'Verify content URL and file integrity',
    STREAM_ERROR: 'Check HLS stream configuration',
    AUTHENTICATION_FAILED: 'Re-pair the display',
    STORAGE_FULL: 'Clear cache on the display',
    NETWORK_TIMEOUT: 'Check network bandwidth and latency',
    INVALID_CONTENT: 'Upload content in supported format',
    HARDWARE_ERROR: 'Restart the display device',
    UNKNOWN: 'Contact technical support',
};

interface DisplayError {
    id: string;
    name: string;
    status: string;
    lastError?: string | null;
    lastErrorCode?: string | null;
    lastErrorAt?: string | null;
    errorCount?: number;
    lastSeen?: string | null;
    hotelId?: string;
    areaId?: string | null;
}

interface ErrorDetailsModalProps {
    display: DisplayError | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRetry?: () => void;
}

export function ErrorDetailsModal({
    display,
    open,
    onOpenChange,
    onRetry,
}: ErrorDetailsModalProps) {
    if (!display) return null;

    const copyErrorInfo = () => {
        const info = `
Display Error Report
====================
Display: ${display.name} (${display.id})
Status: ${display.status}
Error Code: ${display.lastErrorCode || 'N/A'}
Error Message: ${display.lastError || 'N/A'}
Error Time: ${display.lastErrorAt ? format(new Date(display.lastErrorAt), 'PPpp') : 'N/A'}
Error Count: ${display.errorCount || 0}
Last Seen: ${display.lastSeen ? format(new Date(display.lastSeen), 'PPpp') : 'Never'}
    `.trim();

        navigator.clipboard.writeText(info);
        toast.success('Error details copied to clipboard');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Display Error Details
                    </DialogTitle>
                    <DialogDescription>
                        Error information for {display.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Error Badge */}
                    <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                        <div>
                            <p className="font-semibold text-destructive">
                                {display.lastErrorCode || 'UNKNOWN_ERROR'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {display.lastError || ErrorCodeMessages[display.lastErrorCode || 'UNKNOWN'] || 'No additional details available'}
                            </p>
                        </div>
                        {(display.errorCount ?? 0) > 1 && (
                            <Badge variant="outline" className="text-amber-500 border-amber-500">
                                ×{display.errorCount}
                            </Badge>
                        )}
                    </div>

                    {/* Error Timeline */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Timeline
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Error Occurred</p>
                                <p className="font-medium">
                                    {display.lastErrorAt
                                        ? formatDistanceToNow(new Date(display.lastErrorAt), { addSuffix: true })
                                        : 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Last Online</p>
                                <p className="font-medium">
                                    {display.lastSeen
                                        ? formatDistanceToNow(new Date(display.lastSeen), { addSuffix: true })
                                        : 'Never'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Suggested Actions */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Suggested Actions</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• {ErrorCodeSolutions[display.lastErrorCode || 'UNKNOWN'] || 'Check the display and network connection'}</li>
                            <li>• Check the display's network connection</li>
                            <li>• Verify the display is powered on</li>
                            <li>• Clear the display's cache and restart</li>
                        </ul>
                    </div>

                    {/* Technical Details */}
                    <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Technical Details
                        </summary>
                        <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
                            <p><span className="text-muted-foreground">Display ID:</span> {display.id}</p>
                            <p><span className="text-muted-foreground">Hotel ID:</span> {display.hotelId || 'N/A'}</p>
                            <p><span className="text-muted-foreground">Area ID:</span> {display.areaId || 'None'}</p>
                            <p><span className="text-muted-foreground">Error Code:</span> {display.lastErrorCode || 'N/A'}</p>
                        </div>
                    </details>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={copyErrorInfo}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Details
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                        {onRetry && (
                            <Button onClick={onRetry}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry Connection
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
