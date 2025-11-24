/**
 * Database Seed Script
 * Populates database with test data for development
 */
import { PrismaClient, DisplayStatus } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Generate real CUIDs
  const hotelId = createId();
  const areaIds = {
    lobby: createId(),
    reception: createId(),
    restaurant: createId(),
    spa: createId(),
    elevator: createId(),
    conference: createId(),
  };

  // Create a test hotel
  const hotel = await prisma.hotel.upsert({
    where: { id: hotelId },
    update: {},
    create: {
      id: hotelId,
      name: 'Grand Hotel Plaza',
      address: '123 Main Street, Downtown, NY 10001',
    },
  });

  console.log('✓ Created hotel:', hotel.name);

  // Create test displays
  const displays = await Promise.all([
    prisma.display.upsert({
      where: { id: createId() },
      update: {},
      create: {
        id: createId(),
        name: 'Lobby Main Display',
        location: 'Main Lobby - Entrance',
        hotelId: hotel.id,
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
        areaId: areaIds.lobby,
      },
    }),
    prisma.display.upsert({
      where: { id: createId() },
      update: {},
      create: {
        id: createId(),
        name: 'Reception Display',
        location: 'Reception Desk',
        hotelId: hotel.id,
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        areaId: areaIds.reception,
      },
    }),
    prisma.display.upsert({
      where: { id: createId() },
      update: {},
      create: {
        id: createId(),
        name: 'Restaurant Menu Board',
        location: 'Main Restaurant - Entrance',
        hotelId: hotel.id,
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
        areaId: areaIds.restaurant,
      },
    }),
    prisma.display.upsert({
      where: { id: createId() },
      update: {},
      create: {
        id: createId(),
        name: 'Spa Information Display',
        location: 'Spa & Wellness Center',
        hotelId: hotel.id,
        status: DisplayStatus.OFFLINE,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
        areaId: areaIds.spa,
      },
    }),
    prisma.display.upsert({
      where: { id: createId() },
      update: {},
      create: {
        id: createId(),
        name: 'Elevator Lobby Display',
        location: 'Elevator Lobby - Floor 2',
        hotelId: hotel.id,
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
        areaId: areaIds.elevator,
      },
    }),
    prisma.display.upsert({
      where: { id: createId() },
      update: {},
      create: {
        id: createId(),
        name: 'Conference Room Display',
        location: 'Conference Room A',
        hotelId: hotel.id,
        status: DisplayStatus.ERROR,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000),
        areaId: areaIds.conference,
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