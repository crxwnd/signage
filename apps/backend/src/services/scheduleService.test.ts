/**
 * Schedule Service Unit Tests
 * Tests for scheduling logic with RRULE support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Schedule } from '@prisma/client';

// Mock Prisma
vi.mock('../utils/prisma', () => ({
    prisma: {
        display: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        schedule: {
            findMany: vi.fn(),
        },
    },
}));

import { scheduleService } from './scheduleService';

describe('ScheduleService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
        id: 'schedule-1',
        name: 'Test Schedule',
        contentId: 'content-1',
        displayId: 'display-1',
        areaId: null,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2030-12-31'),
        startTime: '00:00',
        endTime: '23:59',
        recurrence: null,
        priority: 100,
        isActive: true,
        hotelId: 'hotel-1',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

    describe('isScheduleActiveNow', () => {
        it('should return true for schedule within date and time range', () => {
            const schedule = createMockSchedule();
            expect(scheduleService.isScheduleActiveNow(schedule)).toBe(true);
        });

        it('should return false for schedule with future start date', () => {
            const schedule = createMockSchedule({
                startDate: new Date('2050-01-01'),
            });
            expect(scheduleService.isScheduleActiveNow(schedule)).toBe(false);
        });

        it('should return false for schedule with past end date', () => {
            const schedule = createMockSchedule({
                endDate: new Date('2020-01-01'),
            });
            expect(scheduleService.isScheduleActiveNow(schedule)).toBe(false);
        });

        it('should return false for schedule outside time range', () => {
            const now = new Date();
            const currentHour = now.getHours();

            // Create a schedule that ends before current time
            const schedule = createMockSchedule({
                startTime: '00:00',
                endTime: currentHour > 1 ? `0${currentHour - 2}:00`.slice(-5) : '00:01',
            });

            // Only test if we're after 02:00
            if (currentHour > 2) {
                expect(scheduleService.isScheduleActiveNow(schedule)).toBe(false);
            }
        });
    });

    describe('isValidRRule', () => {
        it('should return true for valid RRULE', () => {
            expect(scheduleService.isValidRRule('FREQ=DAILY;INTERVAL=1')).toBe(true);
        });

        it('should return true for weekly RRULE', () => {
            expect(scheduleService.isValidRRule('FREQ=WEEKLY;BYDAY=MO,WE,FR')).toBe(true);
        });

        it('should return true for monthly RRULE', () => {
            expect(scheduleService.isValidRRule('FREQ=MONTHLY;BYMONTHDAY=1,15')).toBe(true);
        });

        it('should return false for invalid RRULE', () => {
            expect(scheduleService.isValidRRule('INVALID_RRULE')).toBe(false);
        });

        it('should handle empty string (RRule accepts as valid)', () => {
            // Note: RRule library treats empty string as valid
            expect(scheduleService.isValidRRule('')).toBe(true);
        });
    });

    describe('describeRecurrence', () => {
        it('should return "Una vez" for null recurrence', () => {
            expect(scheduleService.describeRecurrence(null)).toBe('Una vez');
        });

        it('should return human-readable text for valid RRULE', () => {
            const description = scheduleService.describeRecurrence('FREQ=DAILY;INTERVAL=1');
            expect(description).toBeDefined();
            expect(typeof description).toBe('string');
        });

        it('should return original string for invalid RRULE', () => {
            const invalid = 'INVALID_RRULE';
            expect(scheduleService.describeRecurrence(invalid)).toBe(invalid);
        });
    });

    describe('getNextOccurrences', () => {
        it('should return start date for one-time schedule', () => {
            const schedule = createMockSchedule();
            const occurrences = scheduleService.getNextOccurrences(schedule, 5);
            expect(occurrences).toHaveLength(1);
            expect(occurrences[0]).toEqual(schedule.startDate);
        });

        it('should return multiple occurrences for recurring schedule', () => {
            const schedule = createMockSchedule({ recurrence: 'FREQ=DAILY;INTERVAL=1' });
            const occurrences = scheduleService.getNextOccurrences(schedule, 5);
            expect(occurrences.length).toBeGreaterThan(0);
            expect(occurrences.length).toBeLessThanOrEqual(5);
        });

        it('should handle invalid RRULE gracefully', () => {
            const schedule = createMockSchedule({ recurrence: 'INVALID' });
            const occurrences = scheduleService.getNextOccurrences(schedule, 5);
            expect(occurrences).toHaveLength(1);
            expect(occurrences[0]).toEqual(schedule.startDate);
        });
    });
});
