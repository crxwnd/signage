/**
 * Database Seed Script
 * Populates database with test data for development
 */

import { PrismaClient, DisplayStatus } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test hotel with CUID
  const hotelId = createId();
  const hotel = await prisma.hotel.upsert({
    where: { id: hotelId },
    update: {},
    create: {
      id: hotelId,
      name: 'Grand Hotel Plaza',
      address: '123 Main Street, Downtown, NY 10001',
    },
  });

  console.log('✓ Created hotel:', hotel.name, `(${hotel.id})`);

  // Create areas with CUIDs
  const areasData = [
    { name: 'Lobby', slug: 'lobby' },
    { name: 'Reception', slug: 'reception' },
    { name: 'Restaurant', slug: 'restaurant' },
    { name: 'Spa & Wellness', slug: 'spa' },
    { name: 'Gym', slug: 'gym' },
    { name: 'Conference Rooms', slug: 'conference' },
    { name: 'Elevators', slug: 'elevators' },
  ];

  const areas = await Promise.all(
    areasData.map((areaData) => {
      const areaId = createId();
      return prisma.area.upsert({
        where: {
          hotelId_slug: {
            hotelId: hotel.id,
            slug: areaData.slug,
          },
        },
        update: {},
        create: {
          id: areaId,
          name: areaData.name,
          slug: areaData.slug,
          hotelId: hotel.id,
        },
      });
    })
  );

  console.log(`✓ Created ${areas.length} areas`);

  // Map area slugs to IDs for easy reference
  const areaMap = areas.reduce(
    (acc, area) => {
      acc[area.slug] = area.id;
      return acc;
    },
    {} as Record<string, string>
  );

  // Create test displays with CUIDs
  const displaysData = [
    {
      name: 'Lobby Main Display',
      location: 'Main Lobby - Entrance',
      status: DisplayStatus.ONLINE,
      lastSeen: new Date(),
      areaSlug: 'lobby',
    },
    {
      name: 'Reception Display',
      location: 'Reception Desk',
      status: DisplayStatus.ONLINE,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      areaSlug: 'reception',
    },
    {
      name: 'Restaurant Menu Board',
      location: 'Main Restaurant - Entrance',
      status: DisplayStatus.ONLINE,
      lastSeen: new Date(),
      areaSlug: 'restaurant',
    },
    {
      name: 'Spa Information Display',
      location: 'Spa & Wellness Center',
      status: DisplayStatus.OFFLINE,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      areaSlug: 'spa',
    },
    {
      name: 'Elevator Lobby Display',
      location: 'Elevator Lobby - Floor 2',
      status: DisplayStatus.ONLINE,
      lastSeen: new Date(),
      areaSlug: 'elevators',
    },
    {
      name: 'Conference Room Display',
      location: 'Conference Room A',
      status: DisplayStatus.ERROR,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      areaSlug: 'conference',
    },
  ];

  const displays = await Promise.all(
    displaysData.map((displayData) => {
      const displayId = createId();
      return prisma.display.upsert({
        where: { id: displayId },
        update: {},
        create: {
          id: displayId,
          name: displayData.name,
          location: displayData.location,
          hotelId: hotel.id,
          status: displayData.status,
          lastSeen: displayData.lastSeen,
          areaId: areaMap[displayData.areaSlug],
        },
      });
    })
  );

  console.log(`✓ Created ${displays.length} displays`);

  console.log('\n✅ Seeding completed successfully!');
  console.log('\nTest Data Summary:');
  console.log(`  - Hotel: ${hotel.name} (ID: ${hotel.id})`);
  console.log(`  - Areas: ${areas.length}`);
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
