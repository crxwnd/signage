/**
 * Database Seed Script
 * Populates database with test data for development
 */

import { PrismaClient, DisplayStatus } from '@prisma/client';

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
