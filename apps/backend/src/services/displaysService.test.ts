/**
 * Displays Service Unit Tests
 * Basic tests for display business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DisplayStatus } from '@shared-types';

// Mock Prisma
vi.mock('../utils/prisma', () => ({
  prisma: {
    display: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    hotel: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
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

import * as displaysService from './displaysService';
import { prisma } from '../utils/prisma';

describe('DisplaysService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDisplayStats', () => {
    it('should return correct display statistics', async () => {
      // Mock Prisma count responses
      vi.mocked(prisma.display.count)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(6) // online
        .mockResolvedValueOnce(3) // offline
        .mockResolvedValueOnce(1); // error

      const stats = await displaysService.getDisplayStats();

      expect(stats).toEqual({
        total: 10,
        online: 6,
        offline: 3,
        error: 1,
      });

      // Verify Prisma was called correctly
      expect(prisma.display.count).toHaveBeenCalledTimes(4);
      expect(prisma.display.count).toHaveBeenNthCalledWith(1);
      expect(prisma.display.count).toHaveBeenNthCalledWith(2, {
        where: { status: DisplayStatus.ONLINE },
      });
      expect(prisma.display.count).toHaveBeenNthCalledWith(3, {
        where: { status: DisplayStatus.OFFLINE },
      });
      expect(prisma.display.count).toHaveBeenNthCalledWith(4, {
        where: { status: DisplayStatus.ERROR },
      });
    });

    it('should handle empty database', async () => {
      // Mock empty database
      vi.mocked(prisma.display.count)
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // online
        .mockResolvedValueOnce(0) // offline
        .mockResolvedValueOnce(0); // error

      const stats = await displaysService.getDisplayStats();

      expect(stats).toEqual({
        total: 0,
        online: 0,
        offline: 0,
        error: 0,
      });
    });
  });

  describe('getDisplayById', () => {
    it('should return display when found', async () => {
      const mockDisplay = {
        id: 'display-1',
        name: 'Lobby Display',
        location: 'Main Lobby',
        status: DisplayStatus.ONLINE,
        hotelId: 'hotel-1',
        areaId: null,
        lastSeen: new Date(),
        deviceInfo: null,
        pairingCode: null,
        pairedAt: null,
        fallbackContentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        hotel: {
          id: 'hotel-1',
          name: 'Test Hotel',
        },
      };

      vi.mocked(prisma.display.findUnique).mockResolvedValue(mockDisplay);

      const result = await displaysService.getDisplayById('display-1');

      expect(result).toEqual(mockDisplay);
      expect(prisma.display.findUnique).toHaveBeenCalledWith({
        where: { id: 'display-1' },
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('should return null when display not found', async () => {
      vi.mocked(prisma.display.findUnique).mockResolvedValue(null);

      const result = await displaysService.getDisplayById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getDisplays', () => {
    const mockDisplays = [
      {
        id: 'display-1',
        name: 'Lobby Display',
        location: 'Main Lobby',
        status: DisplayStatus.ONLINE,
        hotelId: 'hotel-1',
        areaId: null,
        lastSeen: new Date(),
        deviceInfo: null,
        pairingCode: null,
        pairedAt: null,
        fallbackContentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        hotel: {
          id: 'hotel-1',
          name: 'Test Hotel',
        },
      },
      {
        id: 'display-2',
        name: 'Reception Display',
        location: 'Reception Area',
        status: DisplayStatus.OFFLINE,
        hotelId: 'hotel-1',
        areaId: 'area-1',
        lastSeen: null,
        deviceInfo: null,
        pairingCode: null,
        pairedAt: null,
        fallbackContentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        hotel: {
          id: 'hotel-1',
          name: 'Test Hotel',
        },
      },
    ];

    it('should return paginated displays without filters', async () => {
      vi.mocked(prisma.display.findMany).mockResolvedValue(mockDisplays);
      vi.mocked(prisma.display.count).mockResolvedValue(2);

      const result = await displaysService.getDisplays({}, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter displays by status', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onlineDisplays = [mockDisplays[0]] as any;
      vi.mocked(prisma.display.findMany).mockResolvedValue(onlineDisplays);
      vi.mocked(prisma.display.count).mockResolvedValue(1);

      const result = await displaysService.getDisplays(
        { status: DisplayStatus.ONLINE },
        {}
      );

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: DisplayStatus.ONLINE }),
        })
      );
      expect(result.items).toHaveLength(1);
    });

    it('should filter displays by hotelId', async () => {
      vi.mocked(prisma.display.findMany).mockResolvedValue(mockDisplays);
      vi.mocked(prisma.display.count).mockResolvedValue(2);

      await displaysService.getDisplays({ hotelId: 'hotel-1' }, {});

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hotelId: 'hotel-1' }),
        })
      );
    });

    it('should filter displays by areaId', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const areaDisplays = [mockDisplays[1]] as any;
      vi.mocked(prisma.display.findMany).mockResolvedValue(areaDisplays);
      vi.mocked(prisma.display.count).mockResolvedValue(1);

      await displaysService.getDisplays({ areaId: 'area-1' }, {});

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ areaId: 'area-1' }),
        })
      );
    });

    it('should search displays by name (case-insensitive)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchResults = [mockDisplays[0]] as any;
      vi.mocked(prisma.display.findMany).mockResolvedValue(searchResults);
      vi.mocked(prisma.display.count).mockResolvedValue(1);

      await displaysService.getDisplays({ search: 'lobby' }, {});

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'lobby', mode: 'insensitive' } },
              { location: { contains: 'lobby', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should search displays by location (case-insensitive)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchResults = [mockDisplays[1]] as any;
      vi.mocked(prisma.display.findMany).mockResolvedValue(searchResults);
      vi.mocked(prisma.display.count).mockResolvedValue(1);

      await displaysService.getDisplays({ search: 'reception' }, {});

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ location: expect.objectContaining({ contains: 'reception' }) }),
            ]),
          }),
        })
      );
    });

    it('should combine multiple filters', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.display.findMany).mockResolvedValue([mockDisplays[0]] as any);
      vi.mocked(prisma.display.count).mockResolvedValue(1);

      await displaysService.getDisplays(
        {
          hotelId: 'hotel-1',
          status: DisplayStatus.ONLINE,
          search: 'lobby',
        },
        {}
      );

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hotelId: 'hotel-1',
            status: DisplayStatus.ONLINE,
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should apply pagination correctly', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.display.findMany).mockResolvedValue([mockDisplays[1]] as any);
      vi.mocked(prisma.display.count).mockResolvedValue(15); // 15 total / 5 limit = 3 pages

      const result = await displaysService.getDisplays({}, { page: 2, limit: 5 });

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
          take: 5,
        })
      );
      expect(result.meta.page).toBe(2);
      expect(result.meta.total).toBe(15);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNext).toBe(true); // Page 2 of 3 has next
      expect(result.meta.hasPrev).toBe(true); // Page 2 of 3 has prev
    });

    it('should apply sorting', async () => {
      vi.mocked(prisma.display.findMany).mockResolvedValue(mockDisplays);
      vi.mocked(prisma.display.count).mockResolvedValue(2);

      await displaysService.getDisplays({}, { sortBy: 'name', sortOrder: 'asc' });

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should limit max items per page to 100', async () => {
      vi.mocked(prisma.display.findMany).mockResolvedValue(mockDisplays);
      vi.mocked(prisma.display.count).mockResolvedValue(2);

      await displaysService.getDisplays({}, { limit: 200 });

      expect(prisma.display.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Max limit
        })
      );
    });
  });

  describe('createDisplay', () => {
    it('should auto-create hotel when not found', async () => {
      const mockCreatedHotel = {
        id: 'new-hotel',
        name: 'Demo Hotel',
        address: '123 Demo Street, Demo City',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDisplay = {
        id: 'display-1',
        name: 'New Display',
        location: 'Reception',
        status: DisplayStatus.OFFLINE,
        hotelId: 'new-hotel',
        areaId: null,
        lastSeen: null,
        deviceInfo: null,
        pairingCode: null,
        pairedAt: null,
        fallbackContentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        hotel: {
          id: 'new-hotel',
          name: 'Demo Hotel',
        },
      };

      vi.mocked(prisma.hotel.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.hotel.create).mockResolvedValue(mockCreatedHotel);
      vi.mocked(prisma.display.create).mockResolvedValue(mockDisplay);

      const result = await displaysService.createDisplay({
        name: 'New Display',
        location: 'Reception',
        hotelId: 'new-hotel',
      });

      expect(result.name).toBe('New Display');
      expect(prisma.hotel.create).toHaveBeenCalled();
    });

    it('should create display with correct default status', async () => {
      const mockHotel = {
        id: 'hotel-1',
        name: 'Test Hotel',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        timezone: 'UTC',
        contactEmail: 'test@test.com',
        contactPhone: '123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDisplay = {
        id: 'display-1',
        name: 'New Display',
        location: 'Reception',
        status: DisplayStatus.OFFLINE,
        hotelId: 'hotel-1',
        areaId: null,
        lastSeen: null,
        deviceInfo: null,
        pairingCode: null,
        pairedAt: null,
        fallbackContentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        hotel: {
          id: 'hotel-1',
          name: 'Test Hotel',
        },
      };

      vi.mocked(prisma.hotel.findUnique).mockResolvedValue(mockHotel);
      vi.mocked(prisma.display.create).mockResolvedValue(mockDisplay);

      const result = await displaysService.createDisplay({
        name: 'New Display',
        location: 'Reception',
        hotelId: 'hotel-1',
      });

      expect(result.status).toBe(DisplayStatus.OFFLINE);
      expect(result.name).toBe('New Display');
      expect(prisma.display.create).toHaveBeenCalledWith({
        data: {
          name: 'New Display',
          location: 'Reception',
          hotelId: 'hotel-1',
          areaId: null,
          status: DisplayStatus.OFFLINE,
        },
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });
  });
});
