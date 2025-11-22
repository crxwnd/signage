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

  describe('createDisplay', () => {
    it('should throw error when hotel not found', async () => {
      vi.mocked(prisma.hotel.findUnique).mockResolvedValue(null);

      await expect(
        displaysService.createDisplay({
          name: 'New Display',
          location: 'Reception',
          hotelId: 'non-existent-hotel',
        })
      ).rejects.toThrow('Hotel with id non-existent-hotel not found');
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
