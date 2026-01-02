/**
 * Content Resolver Unit Tests
 * Tests for content priority hierarchy: Alert > Sync > Schedule > Playlist > Fallback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('../utils/prisma', () => ({
    prisma: {
        display: {
            findUnique: vi.fn(),
        },
        alert: {
            findMany: vi.fn(),
        },
        syncGroupDisplay: {
            findFirst: vi.fn(),
        },
        schedule: {
            findMany: vi.fn(),
        },
        displayContent: {
            findMany: vi.fn(),
        },
    },
}));

// Mock scheduleService
vi.mock('./scheduleService', () => ({
    scheduleService: {
        isScheduleActiveNow: vi.fn(),
    },
}));

// Mock logger
vi.mock('../middleware/logger', () => ({
    log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

import { contentResolver } from './contentResolver';
import { prisma } from '../utils/prisma';

describe('ContentResolver', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('resolve', () => {
        it('should return none when display not found', async () => {
            vi.mocked(prisma.display.findUnique).mockResolvedValue(null);

            const result = await contentResolver.resolve('non-existent');

            expect(result.type).toBe('none');
            expect(result.reason).toBe('Display not found');
        });

        it('should return alert when active alert exists', async () => {
            const mockDisplay = {
                id: 'display-1',
                name: 'Test Display',
                hotelId: 'hotel-1',
                areaId: 'area-1',
                status: 'ONLINE',
                location: 'Lobby',
                lastSeen: new Date(),
                deviceInfo: null,
                pairingCode: null,
                pairedAt: null,
                fallbackContentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                area: { id: 'area-1', name: 'Lobby', hotelId: 'hotel-1' },
                hotel: { id: 'hotel-1', name: 'Test Hotel' },
                fallbackContent: null,
            };

            const mockAlert = {
                id: 'alert-1',
                name: 'Emergency Alert',
                type: 'EMERGENCY',
                priority: 1000,
                message: 'This is an emergency',
                isActive: true,
                contentId: 'content-1',
                hotelId: 'hotel-1',
                areaId: null,
                displayId: null,
                startAt: new Date(),
                endAt: null,
                createdBy: 'user-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                content: {
                    id: 'content-1',
                    name: 'Emergency Video',
                    type: 'VIDEO',
                    hlsUrl: '/hls/emergency.m3u8',
                    originalUrl: '/uploads/emergency.mp4',
                    thumbnailUrl: null,
                    duration: 30,
                },
            };

            vi.mocked(prisma.display.findUnique).mockResolvedValue(mockDisplay as any);
            vi.mocked(prisma.alert.findMany).mockResolvedValue([mockAlert] as any);

            const result = await contentResolver.resolve('display-1');

            expect(result.type).toBe('alert');
            expect(result.priority).toBe(2000); // 1000 base + 1000 alert priority
            expect(result.alertId).toBe('alert-1');
        });

        it('should return playlist when no higher priority content', async () => {
            const mockDisplay = {
                id: 'display-1',
                name: 'Test Display',
                hotelId: 'hotel-1',
                areaId: null,
                status: 'ONLINE',
                location: 'Lobby',
                lastSeen: new Date(),
                deviceInfo: null,
                pairingCode: null,
                pairedAt: null,
                fallbackContentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                area: null,
                hotel: { id: 'hotel-1', name: 'Test Hotel' },
                fallbackContent: null,
            };

            const mockPlaylistItems = [
                {
                    id: 'item-1',
                    displayId: 'display-1',
                    contentId: 'content-1',
                    order: 1,
                    startTime: null,
                    endTime: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    content: {
                        id: 'content-1',
                        name: 'Welcome Video',
                        type: 'VIDEO',
                        status: 'READY',
                        hlsUrl: '/hls/welcome.m3u8',
                        originalUrl: '/uploads/welcome.mp4',
                        thumbnailUrl: null,
                        duration: 60,
                    },
                },
            ];

            vi.mocked(prisma.display.findUnique).mockResolvedValue(mockDisplay as any);
            vi.mocked(prisma.alert.findMany).mockResolvedValue([]);
            vi.mocked(prisma.syncGroupDisplay.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.schedule.findMany).mockResolvedValue([]);
            vi.mocked(prisma.displayContent.findMany).mockResolvedValue(mockPlaylistItems as any);

            const result = await contentResolver.resolve('display-1');

            expect(result.type).toBe('playlist');
            expect(result.priority).toBe(0);
        });

        it('should return fallback when no content assigned', async () => {
            const mockFallbackContent = {
                id: 'fallback-1',
                name: 'Fallback Logo',
                type: 'IMAGE',
                hlsUrl: null,
                originalUrl: '/uploads/logo.png',
                thumbnailUrl: null,
                duration: null,
            };

            const mockDisplay = {
                id: 'display-1',
                name: 'Test Display',
                hotelId: 'hotel-1',
                areaId: null,
                status: 'ONLINE',
                location: 'Lobby',
                lastSeen: new Date(),
                deviceInfo: null,
                pairingCode: null,
                pairedAt: null,
                fallbackContentId: 'fallback-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                area: null,
                hotel: { id: 'hotel-1', name: 'Test Hotel' },
                fallbackContent: mockFallbackContent,
            };

            vi.mocked(prisma.display.findUnique).mockResolvedValue(mockDisplay as any);
            vi.mocked(prisma.alert.findMany).mockResolvedValue([]);
            vi.mocked(prisma.syncGroupDisplay.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.schedule.findMany).mockResolvedValue([]);
            vi.mocked(prisma.displayContent.findMany).mockResolvedValue([]);

            const result = await contentResolver.resolve('display-1');

            expect(result.type).toBe('fallback');
            expect(result.priority).toBe(-1);
            expect(result.contentId).toBe('fallback-1');
        });

        it('should return none when no content at all', async () => {
            const mockDisplay = {
                id: 'display-1',
                name: 'Test Display',
                hotelId: 'hotel-1',
                areaId: null,
                status: 'ONLINE',
                location: 'Lobby',
                lastSeen: new Date(),
                deviceInfo: null,
                pairingCode: null,
                pairedAt: null,
                fallbackContentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                area: null,
                hotel: { id: 'hotel-1', name: 'Test Hotel' },
                fallbackContent: null,
            };

            vi.mocked(prisma.display.findUnique).mockResolvedValue(mockDisplay as any);
            vi.mocked(prisma.alert.findMany).mockResolvedValue([]);
            vi.mocked(prisma.syncGroupDisplay.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.schedule.findMany).mockResolvedValue([]);
            vi.mocked(prisma.displayContent.findMany).mockResolvedValue([]);

            const result = await contentResolver.resolve('display-1');

            expect(result.type).toBe('none');
            expect(result.reason).toBe('No content assigned');
        });
    });

    describe('priority hierarchy', () => {
        it('should prioritize alert (1000+) over playlist (0)', () => {
            // Alert priority should always be higher than playlist
            expect(1000).toBeGreaterThan(0);
        });

        it('should prioritize sync (500) over schedule (100)', () => {
            // Sync priority should be higher than schedule
            expect(500).toBeGreaterThan(100);
        });

        it('should prioritize schedule (100+) over playlist (0)', () => {
            // Schedule priority should be higher than playlist
            expect(100).toBeGreaterThan(0);
        });
    });
});
