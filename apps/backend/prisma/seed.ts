/**
 * Database Seed Script
 * Populates database with test data for development
 */

import { PrismaClient, DisplayStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // 1. CREATE HOTEL
  // ============================================
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

  // ============================================
  // 2. CREATE AREAS (NEW)
  // ============================================
  const areas = await Promise.all([
    prisma.area.upsert({
      where: { id: 'seed-area-lobby' },
      update: {},
      create: {
        id: 'seed-area-lobby',
        name: 'Lobby Principal',
        description: 'Área de recepción y lobby principal del hotel',
        hotelId: hotel.id,
      },
    }),
    prisma.area.upsert({
      where: { id: 'seed-area-restaurant' },
      update: {},
      create: {
        id: 'seed-area-restaurant',
        name: 'Restaurante Buffet',
        description: 'Área de restaurante principal con buffet',
        hotelId: hotel.id,
      },
    }),
    prisma.area.upsert({
      where: { id: 'seed-area-pool' },
      update: {},
      create: {
        id: 'seed-area-pool',
        name: 'Zona Piscina',
        description: 'Área de piscina y recreación',
        hotelId: hotel.id,
      },
    }),
  ]);

  const [areaLobby, areaRestaurant, areaPool] = areas;

  console.log(`✓ Created ${areas.length} areas`);
  console.log(`    - ${areaLobby.name}`);
  console.log(`    - ${areaRestaurant.name}`);
  console.log(`    - ${areaPool.name}`);

  // ============================================
  // 3. CREATE USERS (Optimized: Single password hash)
  // ============================================
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const usersData = [
    {
      email: 'admin@hotel.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN' as UserRole,
      hotelId: null,
      areaId: null, // Super admin not tied to specific area
    },
    {
      email: 'manager@hotel.com',
      name: 'Hotel Manager',
      role: 'HOTEL_ADMIN' as UserRole,
      hotelId: hotel.id,
      areaId: null, // Hotel admin manages all areas
    },
    {
      email: 'area@hotel.com',
      name: 'Area Manager - Restaurant',
      role: 'AREA_MANAGER' as UserRole,
      hotelId: hotel.id,
      areaId: areaRestaurant.id, // 🔑 VINCULADO AL RESTAURANTE
    },
  ];

  for (const userData of usersData) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: passwordHash, // IMPORTANTE: Resetea el password si ya existía
        role: userData.role,
        areaId: userData.areaId,
      },
      create: {
        email: userData.email,
        password: passwordHash,
        name: userData.name,
        role: userData.role,
        hotelId: userData.hotelId,
        areaId: userData.areaId,
        twoFactorEnabled: false,
      },
    });
  }

  console.log(`✓ Created/Updated ${usersData.length} users with password: Admin123!`);
  console.log(`    - Super Admin: admin@hotel.com (all hotels, all areas)`);
  console.log(`    - Hotel Manager: manager@hotel.com (hotel: ${hotel.name}, all areas)`);
  console.log(`    - Area Manager: area@hotel.com (area: ${areaRestaurant.name} ONLY)`);

  // ============================================
  // 4. CREATE DISPLAYS (with area relationships)
  // ============================================
  const displays = await Promise.all([
    // LOBBY AREA
    prisma.display.upsert({
      where: { id: 'seed-display-1' },
      update: {}, // Los displays no necesitamos forzar update
      create: {
        id: 'seed-display-1',
        name: 'Lobby Main Display',
        location: 'Main Lobby - Entrance',
        hotelId: hotel.id,
        areaId: areaLobby.id, // FK relationship
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
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
        areaId: areaLobby.id, // FK relationship
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      },
    }),

    // RESTAURANT AREA
    prisma.display.upsert({
      where: { id: 'seed-display-3' },
      update: {},
      create: {
        id: 'seed-display-3',
        name: 'Restaurant Menu Board',
        location: 'Main Restaurant - Entrance',
        hotelId: hotel.id,
        areaId: areaRestaurant.id, // FK relationship
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
      },
    }),
    prisma.display.upsert({
      where: { id: 'seed-display-4' },
      update: {},
      create: {
        id: 'seed-display-4',
        name: 'Restaurant Buffet Display',
        location: 'Restaurant - Buffet Area',
        hotelId: hotel.id,
        areaId: areaRestaurant.id, // FK relationship
        status: DisplayStatus.OFFLINE,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    }),

    // POOL AREA
    prisma.display.upsert({
      where: { id: 'seed-display-5' },
      update: {},
      create: {
        id: 'seed-display-5',
        name: 'Pool Area Display',
        location: 'Swimming Pool - Bar Area',
        hotelId: hotel.id,
        areaId: areaPool.id, // FK relationship
        status: DisplayStatus.ONLINE,
        lastSeen: new Date(),
      },
    }),
    prisma.display.upsert({
      where: { id: 'seed-display-6' },
      update: {},
      create: {
        id: 'seed-display-6',
        name: 'Pool Lounge Display',
        location: 'Pool Lounge Area',
        hotelId: hotel.id,
        areaId: areaPool.id, // FK relationship
        status: DisplayStatus.ERROR,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      },
    }),
  ]);

  console.log(`✓ Created ${displays.length} displays`);
  console.log(`    - ${areaLobby.name}: 2 displays`);
  console.log(`    - ${areaRestaurant.name}: 2 displays`);
  console.log(`    - ${areaPool.name}: 2 displays`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📊 Test Data Summary:');
  console.log(`  - Hotel: ${hotel.name}`);
  console.log(`  - Areas: ${areas.length}`);
  areas.forEach((area) => {
    console.log(`      • ${area.name}`);
  });
  console.log(`  - Users: ${usersData.length}`);
  console.log(`      • Super Admin: admin@hotel.com / Admin123!`);
  console.log(`      • Hotel Manager: manager@hotel.com / Manager123!`);
  console.log(`      • Area Manager: area@hotel.com / Admin123! (${areaRestaurant.name})`);
  console.log(`  - Displays: ${displays.length}`);
  console.log(`      • Online: ${displays.filter((d) => d.status === DisplayStatus.ONLINE).length}`);
  console.log(`      • Offline: ${displays.filter((d) => d.status === DisplayStatus.OFFLINE).length}`);
  console.log(`      • Error: ${displays.filter((d) => d.status === DisplayStatus.ERROR).length}`);
  console.log('\n🔐 RBAC Test Scenarios:');
  console.log('  - Super Admin can see ALL areas and displays');
  console.log('  - Hotel Manager can see ALL areas in their hotel');
  console.log(`  - Area Manager can ONLY see "${areaRestaurant.name}" and its 2 displays`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
