'use client';

/**
 * PlaylistBuilder Component
 * Inline component to build a playlist of content items with ordering and duration
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContentSelector } from '@/components/ContentSelector';
import { useContent } from '@/hooks/useContent';
import { GripVertical, Trash2, Plus, Clock, Video, Image } from 'lucide-react';

interface PlaylistItem {
    contentId: string;
    duration: number;
    order: number;
}

interface PlaylistBuilderProps {
    hotelId: string;
    items: PlaylistItem[];
    onChange: (items: PlaylistItem[]) => void;
}

export function PlaylistBuilder({ hotelId, items, onChange }: PlaylistBuilderProps) {
    const [showSelector, setShowSelector] = useState(false);
    const { contents } = useContent();

    const addItem = (contentId: string) => {
        if (!contentId) return;
        const content = contents?.find(c => c.id === contentId);
        const newItem: PlaylistItem = {
            contentId,
            duration: content?.duration || 10,
            order: items.length,
        };
        onChange([...items, newItem]);
        setShowSelector(false);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems.map((item, i) => ({ ...item, order: i })));
    };

    const updateDuration = (index: number, duration: number) => {
        const newItems = [...items];
        if (newItems[index]) {
            newItems[index] = { ...newItems[index], duration };
            onChange(newItems);
        }
    };

    const getContentName = (contentId: string) => {
        return contents?.find(c => c.id === contentId)?.name || 'Contenido';
    };

    const getContentType = (contentId: string) => {
        return contents?.find(c => c.id === contentId)?.type || 'VIDEO';
    };

    const getContentIcon = (contentId: string) => {
        const type = getContentType(contentId);
        if (type === 'VIDEO') return <Video className="w-4 h-4 text-blue-400" />;
        return <Image className="w-4 h-4 text-green-400" />;
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium">
                Items de la playlist ({items.length})
            </label>

            {/* Items list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item, index) => (
                    <div
                        key={`${item.contentId}-${index}`}
                        className="flex items-center gap-2 p-2 bg-muted rounded-lg border"
                    >
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />

                        <span className="text-xs text-muted-foreground w-5">
                            {index + 1}.
                        </span>

                        {getContentIcon(item.contentId)}

                        <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">
                                {getContentName(item.contentId)}
                            </span>
                        </div>

                        {/* Duration for images */}
                        {getContentType(item.contentId) === 'IMAGE' && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <Input
                                    type="number"
                                    min={1}
                                    max={300}
                                    value={item.duration}
                                    onChange={(e) => updateDuration(index, parseInt(e.target.value) || 10)}
                                    className="w-14 h-7 text-xs"
                                />
                                <span className="text-xs text-muted-foreground">s</span>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Add item */}
            {showSelector ? (
                <div className="p-3 bg-muted rounded-lg border border-primary/30">
                    <ContentSelector
                        hotelId={hotelId}
                        value=""
                        onChange={addItem}
                        label="Seleccionar contenido para agregar"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSelector(false)}
                        className="mt-2 text-xs"
                    >
                        Cancelar
                    </Button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSelector(true)}
                    className="w-full border-dashed"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar contenido
                </Button>
            )}

            {items.length === 0 && !showSelector && (
                <p className="text-xs text-muted-foreground text-center py-2">
                    Agrega contenidos para crear la secuencia sincronizada
                </p>
            )}
        </div>
    );
}
