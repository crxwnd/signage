/**
 * Database Seed Script
 * Populates database with test data for development
 */

import { PrismaClient, DisplayStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test hotel
  const hotel = await prisma.hotel.upsert({
    where: { id: 'seed-hotel-1' },
    update: {},
    create: {
      id: 'seed-hotel-1',
      name: 'Grand Hotel Plaza',
      address: '123 Main Street, Downtown, NY 10001',
    },
  });

  console.log('✓ Created hotel:', hotel.name);

  // Create test users with hashed passwords (bcrypt 12 rounds)
  const users = await Promise.all([
    // Super Admin - Full system access
    prisma.user.upsert({
      where: { email: 'admin@hotel.com' },
      update: {},
      create: {
        email: 'admin@hotel.com',
        password: await bcrypt.hash('Admin123!', 12),
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        hotelId: null, // Super admin not tied to specific hotel
      },
    }),
    // Hotel Admin - Manages specific hotel
    prisma.user.upsert({
      where: { email: 'manager@hotel.com' },
      update: {},
      create: {
        email: 'manager@hotel.com',
        password: await bcrypt.hash('Manager123!', 12),
        name: 'Hotel Manager',
        role: 'HOTEL_ADMIN',
        hotelId: hotel.id,
      },
    }),
    // Area Manager - Manages specific areas within hotel
    prisma.user.upsert({
      where: { email: 'area@hotel.com' },
      update: {},
      create: {
        email: 'area@hotel.com',
        password: await bcrypt.hash('Area123!', 12),
        name: 'Area Manager',
        role: 'AREA_MANAGER',
        hotelId: hotel.id,
      },
    }),
  ]);

  console.log(`✓ Created ${users.length} users`);

  // Create test displays
  const displays = await Promise.all([
    prisma.display.upsert({
      where: { id: 'seed-display-1' },
      update: {},
      create: {
        id: 'seed-display-1',
        name: 'Lobby Main Display',
        location: 'Main Lobby - Entrance',
        hotelId: hotel.id,
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
        areaId: 'lobby',
      },
    }),
    prisma.display.upsert({
      where: { id: 'seed-display-2' },
      update: {},
      create: {
        id: 'seed-display-2',
        name: 'Reception Display',
        location: 'Reception Desk',
        hotelId: hotel.id,
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        areaId: 'reception',
      },
    }),
    prisma.display.upsert({
      where: { id: 'seed-display-3' },
      update: {},
      create: {
        id: 'seed-display-3',
        name: 'Restaurant Menu Board',
        location: 'Main Restaurant - Entrance',
        hotelId: hotel.id,
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
        areaId: 'restaurant',
      },
    }),
    prisma.display.upsert({
      where: { id: 'seed-display-4' },
      update: {},
      create: {
        id: 'seed-display-4',
        name: 'Spa Information Display',
        location: 'Spa & Wellness Center',
        hotelId: hotel.id,
        status: DisplayStatus.OFFLINE,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        areaId: 'spa',
      },
    }),
    prisma.display.upsert({
      where: { id: 'seed-display-5' },
      update: {},
      create: {
        id: 'seed-display-5',
        name: 'Elevator Lobby Display',
        location: 'Elevator Lobby - Floor 2',
        hotelId: hotel.id,
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
        areaId: 'elevator-lobby',
      },
    }),
    prisma.display.upsert({
      where: { id: 'seed-display-6' },
      update: {},
      create: {
        id: 'seed-display-6',
        name: 'Conference Room Display',
        location: 'Conference Room A',
        hotelId: hotel.id,
        status: DisplayStatus.ERROR,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        areaId: 'conference',
      },
    }),
  ]);

  console.log(`✓ Created ${displays.length} displays`);

  console.log('\n✅ Seeding completed successfully!');
  console.log('\nTest Data Summary:');
  console.log(`  - Hotel: ${hotel.name}`);
  console.log(`  - Users: ${users.length}`);
  console.log(`    - Super Admin: admin@hotel.com / Admin123!`);
  console.log(`    - Hotel Manager: manager@hotel.com / Manager123!`);
  console.log(`    - Area Manager: area@hotel.com / Area123!`);
  console.log(`  - Displays: ${displays.length}`);
  console.log(`    - Online: ${displays.filter((d) => d.status === DisplayStatus.ONLINE).length}`);
  console.log(`    - Offline: ${displays.filter((d) => d.status === DisplayStatus.OFFLINE).length}`);
  console.log(`    - Error: ${displays.filter((d) => d.status === DisplayStatus.ERROR).length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
