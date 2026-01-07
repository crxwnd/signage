/**
 * Hotel Service
 * Business logic for hotel CRUD operations
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';

// Types
export interface Hotel {
    id: string;
    name: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateHotelPayload {
    name: string;
    address: string;
}

export interface UpdateHotelPayload {
    name?: string;
    address?: string;
}

export interface HotelStats {
    id: string;
    name: string;
    displayCount: number;
    onlineDisplays: number;
    offlineDisplays: number;
    contentCount: number;
    userCount: number;
    areaCount: number;
    alertCount: number;
    scheduleCount: number;
}

/**
 * Get all hotels with optional stats
 */
export async function getHotels(includeStats = false): Promise<(Hotel & { stats?: Partial<HotelStats> })[]> {
    const hotels = await prisma.hotel.findMany({
        orderBy: { name: 'asc' },
        include: includeStats ? {
            _count: {
                select: {
                    displays: true,
                    contents: true,
                    users: true,
                    areas: true,
                    alerts: true,
                    schedules: true,
                }
            }
        } : undefined,
    });

    if (!includeStats) {
        return hotels as Hotel[];
    }

    // Get online display counts
    const displayStats = await prisma.display.groupBy({
        by: ['hotelId', 'status'],
        _count: { id: true }
    });

    return hotels.map(hotel => {
        const hotelDisplayStats = displayStats.filter(s => s.hotelId === hotel.id);
        const onlineCount = hotelDisplayStats.find(s => s.status === 'ONLINE')?._count.id || 0;
        const offlineCount = hotelDisplayStats.find(s => s.status === 'OFFLINE')?._count.id || 0;

        return {
            ...hotel,
            stats: {
                displayCount: (hotel as any)._count?.displays || 0,
                onlineDisplays: onlineCount,
                offlineDisplays: offlineCount,
                contentCount: (hotel as any)._count?.contents || 0,
                userCount: (hotel as any)._count?.users || 0,
                areaCount: (hotel as any)._count?.areas || 0,
                alertCount: (hotel as any)._count?.alerts || 0,
                scheduleCount: (hotel as any)._count?.schedules || 0,
            }
        };
    }) as (Hotel & { stats: Partial<HotelStats> })[];
}

/**
 * Get hotel by ID with full stats
 */
export async function getHotelById(id: string): Promise<(Hotel & { stats: HotelStats }) | null> {
    const hotel = await prisma.hotel.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    displays: true,
                    contents: true,
                    users: true,
                    areas: true,
                    alerts: true,
                    schedules: true,
                }
            }
        }
    });

    if (!hotel) return null;

    // Get display stats
    const [onlineDisplays, offlineDisplays] = await Promise.all([
        prisma.display.count({ where: { hotelId: id, status: 'ONLINE' } }),
        prisma.display.count({ where: { hotelId: id, status: 'OFFLINE' } }),
    ]);

    return {
        id: hotel.id,
        name: hotel.name,
        address: hotel.address,
        createdAt: hotel.createdAt,
        updatedAt: hotel.updatedAt,
        stats: {
            id: hotel.id,
            name: hotel.name,
            displayCount: hotel._count.displays,
            onlineDisplays,
            offlineDisplays,
            contentCount: hotel._count.contents,
            userCount: hotel._count.users,
            areaCount: hotel._count.areas,
            alertCount: hotel._count.alerts,
            scheduleCount: hotel._count.schedules,
        }
    };
}

/**
 * Create hotel
 */
export async function createHotel(payload: CreateHotelPayload): Promise<Hotel> {
    const hotel = await prisma.hotel.create({
        data: {
            name: payload.name,
            address: payload.address,
        }
    });

    log.info('Hotel created', { hotelId: hotel.id, name: hotel.name });

    return hotel as Hotel;
}

/**
 * Update hotel
 */
export async function updateHotel(id: string, payload: UpdateHotelPayload): Promise<Hotel> {
    const existing = await prisma.hotel.findUnique({ where: { id } });

    if (!existing) {
        throw new Error(`Hotel with id ${id} not found`);
    }

    const hotel = await prisma.hotel.update({
        where: { id },
        data: payload,
    });

    log.info('Hotel updated', { hotelId: id });

    return hotel as Hotel;
}

/**
 * Delete hotel
 * WARNING: This will cascade delete all related data!
 */
export async function deleteHotel(id: string): Promise<void> {
    const existing = await prisma.hotel.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    displays: true,
                    users: true,
                    contents: true,
                }
            }
        }
    });

    if (!existing) {
        throw new Error(`Hotel with id ${id} not found`);
    }

    // Warn about cascade
    const totalRelated = existing._count.displays + existing._count.users + existing._count.contents;
    if (totalRelated > 0) {
        log.warn('Deleting hotel with related data', {
            hotelId: id,
            displays: existing._count.displays,
            users: existing._count.users,
            contents: existing._count.contents,
        });
    }

    await prisma.hotel.delete({ where: { id } });

    log.info('Hotel deleted', { hotelId: id, name: existing.name });
}

/**
 * Get hotel statistics summary
 */
export async function getHotelStatsSummary(): Promise<{
    totalHotels: number;
    totalDisplays: number;
    onlineDisplays: number;
    totalContent: number;
    totalUsers: number;
}> {
    const [totalHotels, totalDisplays, onlineDisplays, totalContent, totalUsers] = await Promise.all([
        prisma.hotel.count(),
        prisma.display.count(),
        prisma.display.count({ where: { status: 'ONLINE' } }),
        prisma.content.count(),
        prisma.user.count(),
    ]);

    return {
        totalHotels,
        totalDisplays,
        onlineDisplays,
        totalContent,
        totalUsers,
    };
}

export default {
    getHotels,
    getHotelById,
    createHotel,
    updateHotel,
    deleteHotel,
    getHotelStatsSummary,
};
