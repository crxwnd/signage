'use client';

/**
 * ContentSelector Component
 * Hybrid content selector with library browsing and upload tabs
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useContent } from '@/hooks/useContent';
import { uploadContent } from '@/lib/api/content';
import { Folder, Upload, Search, Video, Image, FileCode, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ContentSelectorProps {
    hotelId: string;
    value?: string;
    onChange: (contentId: string) => void;
    allowedTypes?: ('VIDEO' | 'IMAGE' | 'HTML')[];
    label?: string;
}

export function ContentSelector({
    hotelId,
    value,
    onChange,
    allowedTypes,
    label = 'Contenido'
}: ContentSelectorProps) {
    const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { contents, isLoading, refetch } = useContent();

    // Filter contents
    const filteredContents = contents?.filter(content => {
        if (content.status !== 'READY') return false;
        if (allowedTypes && !allowedTypes.includes(content.type as 'VIDEO' | 'IMAGE' | 'HTML')) return false;
        if (typeFilter !== 'all' && content.type !== typeFilter) return false;
        if (search && !content.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }) || [];

    // Handle file drop
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

        try {
            setIsUploading(true);
            setUploadError(null);
            setUploadProgress(10);

            // Simulate progress since we don't have real progress tracking
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev && prev < 90) return prev + 10;
                    return prev;
                });
            }, 500);

            const result = await uploadContent(file, name, hotelId);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Wait for processing to start, then select
            setTimeout(() => {
                onChange(result.id);
                setActiveTab('library');
                setUploadProgress(null);
                setIsUploading(false);
                refetch();
            }, 500);

        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error instanceof Error ? error.message : 'Error al subir archivo');
            setUploadProgress(null);
            setIsUploading(false);
        }
    }, [hotelId, onChange, refetch]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'video/*': ['.mp4', '.webm', '.mov'],
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        },
        maxSize: 500 * 1024 * 1024,
        multiple: false,
        disabled: isUploading,
    });

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'VIDEO': return <Video className="w-6 h-6 text-blue-400" />;
            case 'IMAGE': return <Image className="w-6 h-6 text-green-400" />;
            case 'HTML': return <FileCode className="w-6 h-6 text-purple-400" />;
            default: return null;
        }
    };

    const formatDuration = (seconds?: number | null) => {
        if (!seconds) return null;
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const selectedContent = contents?.find(c => c.id === value);

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{label}</label>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'upload')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="library">
                        <Folder className="w-4 h-4 mr-2" />
                        Biblioteca
                    </TabsTrigger>
                    <TabsTrigger value="upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Subir
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="library" className="space-y-3 mt-3">
                    {/* Search and filters */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar contenido..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="VIDEO">Videos</SelectItem>
                                <SelectItem value="IMAGE">Imágenes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                        {isLoading ? (
                            <div className="col-span-full text-center py-8 text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                Cargando...
                            </div>
                        ) : filteredContents.length === 0 ? (
                            <div className="col-span-full text-center py-8 text-muted-foreground">
                                No hay contenido disponible
                            </div>
                        ) : (
                            filteredContents.map((content) => (
                                <button
                                    key={content.id}
                                    type="button"
                                    onClick={() => onChange(content.id)}
                                    className={cn(
                                        "relative flex flex-col items-center p-2 rounded-lg border-2 transition-all",
                                        "hover:border-primary/50 hover:bg-accent/50",
                                        value === content.id
                                            ? "border-primary bg-accent"
                                            : "border-border bg-card"
                                    )}
                                >
                                    {value === content.id && (
                                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                        </div>
                                    )}

                                    <div className="w-full aspect-video bg-muted rounded flex items-center justify-center mb-1.5 overflow-hidden">
                                        {content.thumbnailUrl ? (
                                            <img
                                                src={`${API_URL}${content.thumbnailUrl}`}
                                                alt={content.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            getContentIcon(content.type)
                                        )}
                                    </div>

                                    <span className="text-xs truncate w-full text-center">
                                        {content.name}
                                    </span>
                                    {content.duration && (
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDuration(content.duration)}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="upload" className="mt-3">
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                            isUploading && "pointer-events-none opacity-50",
                            isDragActive
                                ? "border-primary bg-accent/50"
                                : "border-border hover:border-primary/50 hover:bg-accent/30"
                        )}
                    >
                        <input {...getInputProps()} />

                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                                <Upload className="w-6 h-6 text-primary" />
                            </div>

                            {isDragActive ? (
                                <p className="text-foreground">Suelta el archivo aquí...</p>
                            ) : (
                                <>
                                    <p className="text-foreground text-sm">
                                        Arrastra un archivo o haz clic para buscar
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        MP4, WebM, PNG, JPG, GIF - Máx 500MB
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    {uploadProgress !== null && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Subiendo...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {uploadError && (
                        <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
                            {uploadError}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Selected content indicator */}
            {value && selectedContent && (
                <div className="flex items-center gap-2 p-2 bg-accent rounded border border-primary/30">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm flex-1 truncate">
                        {selectedContent.name}
                    </span>
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
