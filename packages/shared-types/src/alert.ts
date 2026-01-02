/**
 * Alert Types
 * Types for the alert system
 */

export type AlertType = 'INFO' | 'WARNING' | 'EMERGENCY';

export interface Alert {
    id: string;
    name: string;
    message?: string | null;
    contentId: string;
    content?: {
        id: string;
        name: string;
        type: string;
        thumbnailUrl?: string | null;
        hlsUrl?: string | null;
        originalUrl?: string;
    };
    hotelId: string;
    hotel?: { id: string; name: string };
    areaId?: string | null;
    area?: { id: string; name: string } | null;
    displayId?: string | null;
    display?: { id: string; name: string } | null;
    type: AlertType;
    priority: number;
    startAt: string;
    endAt?: string | null;
    isActive: boolean;
    createdBy: string;
    creator?: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
}

export interface CreateAlertDTO {
    name: string;
    message?: string;
    contentId: string;
    hotelId?: string;
    areaId?: string;
    displayId?: string;
    type?: AlertType;
    priority?: number;
    startAt?: string;
    endAt?: string;
}
