/**
 * QuickUrlDialog Component
 * Dialog for quickly playing a URL on a display or sync group
 * Without saving to Content Library (temporary content)
 */

'use client';

import * as React from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/auth';
import {
    Play,
    Youtube,
    Globe,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import type { ContentType } from '@/lib/api/content';

/**
 * Source types for content
 */
type ContentSource = 'YOUTUBE' | 'VIMEO' | 'URL';

/**
 * Props for the component
 */
interface QuickUrlDialogProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'display' | 'syncGroup';
    targetId: string;
    targetName: string;
    onSuccess?: () => void;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Detect content source from URL
 */
function detectSourceFromUrl(url: string): { source: ContentSource; type: ContentType } | null {
    const lowerUrl = url.toLowerCase();

    // YouTube detection
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        return { source: 'YOUTUBE', type: 'VIDEO' };
    }

    // Vimeo detection
    if (lowerUrl.includes('vimeo.com')) {
        return { source: 'VIMEO', type: 'VIDEO' };
    }

    // Direct file detection by extension
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
        return { source: 'URL', type: 'VIDEO' };
    }

    if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
        return { source: 'URL', type: 'IMAGE' };
    }

    return null;
}

/**
 * Extract YouTube video ID
 */
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
        /youtube\.com\/embed\/([^&?/]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

/**
 * Get thumbnail URL for external content
 */
function getThumbnailUrl(url: string, source: ContentSource): string | null {
    if (source === 'YOUTUBE') {
        const videoId = extractYouTubeId(url);
        if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    // For direct URLs, use the URL itself if it's an image
    if (source === 'URL' && /\.(jpg|jpeg|png|gif|webp)/i.test(url)) {
        return url;
    }
    return null;
}

export function QuickUrlDialog({
    isOpen,
    onClose,
    targetType,
    targetId,
    targetName,
    onSuccess,
}: QuickUrlDialogProps) {
    const { toast } = useToast();

    // Form state
    const [contentUrl, setContentUrl] = React.useState('');
    const [detectedSource, setDetectedSource] = React.useState<ContentSource | null>(null);
    const [detectedType, setDetectedType] = React.useState<ContentType | null>(null);
    const [urlThumbnail, setUrlThumbnail] = React.useState<string | null>(null);
    const [urlError, setUrlError] = React.useState<string | null>(null);

    // Submit state
    const [submitState, setSubmitState] = React.useState<SubmitState>('idle');
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    /**
     * Reset form when modal closes
     */
    React.useEffect(() => {
        if (!isOpen) {
            setContentUrl('');
            setDetectedSource(null);
            setDetectedType(null);
            setUrlThumbnail(null);
            setUrlError(null);
            setSubmitState('idle');
            setErrorMessage(null);
        }
    }, [isOpen]);

    /**
     * Handle URL input change
     */
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setContentUrl(url);
        setUrlError(null);

        if (!url.trim()) {
            setDetectedSource(null);
            setDetectedType(null);
            setUrlThumbnail(null);
            return;
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            setDetectedSource(null);
            setDetectedType(null);
            setUrlThumbnail(null);
            return;
        }

        // Detect source and type
        const detected = detectSourceFromUrl(url);
        if (detected) {
            setDetectedSource(detected.source);
            setDetectedType(detected.type);
            const thumbnail = getThumbnailUrl(url, detected.source);
            setUrlThumbnail(thumbnail);
        } else {
            setUrlError('URL no reconocida. Usa YouTube, Vimeo o un link directo a video/imagen.');
            setDetectedSource(null);
            setDetectedType(null);
            setUrlThumbnail(null);
        }
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contentUrl.trim() || !detectedSource) {
            setUrlError('Por favor ingresa una URL válida');
            return;
        }

        setSubmitState('submitting');
        setErrorMessage(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            // Different endpoint based on target type
            const endpoint = targetType === 'display'
                ? `${API_URL}/api/displays/${targetId}/quick-url`
                : `${API_URL}/api/sync/groups/${targetId}/quick-url`;

            const response = await authenticatedFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: contentUrl,
                    source: detectedSource,
                    type: detectedType,
                    thumbnailUrl: urlThumbnail,
                    loop: true, // Always loop for quick play
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to play content');
            }

            setSubmitState('success');
            toast({
                title: 'Content sent!',
                description: `Playing on ${targetName}`,
            });
            onSuccess?.();

            // Auto-close after success
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            setSubmitState('error');
            setErrorMessage(error instanceof Error ? error.message : 'Failed to play content');
        }
    };

    const isSubmitting = submitState === 'submitting';
    const isSuccess = submitState === 'success';
    const isError = submitState === 'error';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Quick Play URL
                    </DialogTitle>
                    <DialogDescription>
                        Play content from a URL directly on {targetName}.
                        Content will loop automatically.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* URL Input */}
                        <div className="grid gap-2">
                            <Label htmlFor="quick-url">
                                Content URL <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="quick-url"
                                type="url"
                                value={contentUrl}
                                onChange={handleUrlChange}
                                placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                                className={urlError ? 'border-destructive' : ''}
                                disabled={isSubmitting || isSuccess}
                            />
                            {urlError && (
                                <p className="text-sm text-destructive">{urlError}</p>
                            )}
                        </div>

                        {/* URL Preview */}
                        {detectedSource && submitState === 'idle' && (
                            <div className="rounded-lg border border-border p-4">
                                <div className="flex items-center gap-4">
                                    {/* Source Icon/Thumbnail */}
                                    <div className="flex-shrink-0">
                                        {urlThumbnail ? (
                                            <div className="relative h-16 w-28 overflow-hidden rounded-md bg-muted">
                                                <Image
                                                    src={urlThumbnail}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        ) : (
                                            <div className={`flex h-16 w-16 items-center justify-center rounded-md ${detectedSource === 'YOUTUBE' ? 'bg-red-500/10' : 'bg-blue-500/10'
                                                }`}>
                                                {detectedSource === 'YOUTUBE' ? (
                                                    <Youtube className="h-8 w-8 text-red-500" />
                                                ) : (
                                                    <Globe className="h-8 w-8 text-blue-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Source Info */}
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="font-medium capitalize">
                                            {detectedSource.toLowerCase()} {detectedType?.toLowerCase()}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate max-w-full" title={contentUrl}>
                                            {contentUrl}
                                        </p>
                                        <p className="text-xs text-green-600 mt-1">✓ Will loop automatically</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submitting State */}
                        {isSubmitting && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-2">Sending to {targetName}...</span>
                            </div>
                        )}

                        {/* Success State */}
                        {isSuccess && (
                            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-center">
                                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                                <p className="font-medium text-green-600">Playing on {targetName}!</p>
                            </div>
                        )}

                        {/* Error State */}
                        {isError && errorMessage && (
                            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-center">
                                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
                                <p className="font-medium text-red-600">Failed to play</p>
                                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            {isSuccess ? 'Close' : 'Cancel'}
                        </Button>
                        {!isSuccess && (
                            <Button
                                type="submit"
                                disabled={!detectedSource || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4" />
                                        Play Now
                                    </>
                                )}
                            </Button>
                        )}
                        {isError && (
                            <Button
                                type="button"
                                onClick={() => setSubmitState('idle')}
                            >
                                Try Again
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
