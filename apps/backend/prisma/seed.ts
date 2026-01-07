/**
 * Database Seed Script
 * Populates database with test data for development
 * Uses auto-generated CUIDs for all entities
 */

import { PrismaClient, DisplayStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // 1. CREATE HOTEL (auto-generated CUID)
  // ============================================
  const hotel = await prisma.hotel.create({
    data: {
      name: 'Grand Hotel Plaza',
      address: '123 Main Street, Downtown, NY 10001',
    },
  });

  console.log('✓ Created hotel:', hotel.name, `(ID: ${hotel.id})`);

  // ============================================
  // 2. CREATE AREAS (auto-generated CUIDs)
  // ============================================
  const areaLobby = await prisma.area.create({
    data: {
      name: 'Lobby Principal',
      description: 'Área de recepción y lobby principal del hotel',
      hotelId: hotel.id,
    },
  });

  const areaRestaurant = await prisma.area.create({
    data: {
      name: 'Restaurante Buffet',
      description: 'Área de restaurante principal con buffet',
      hotelId: hotel.id,
    },
  });

  const areaPool = await prisma.area.create({
    data: {
      name: 'Zona Piscina',
      description: 'Área de piscina y recreación',
      hotelId: hotel.id,
    },
  });

  const areas = [areaLobby, areaRestaurant, areaPool];

  console.log(`✓ Created ${areas.length} areas`);
  console.log(`    - ${areaLobby.name} (ID: ${areaLobby.id})`);
  console.log(`    - ${areaRestaurant.name} (ID: ${areaRestaurant.id})`);
  console.log(`    - ${areaPool.name} (ID: ${areaPool.id})`);

  // ============================================
  // 3. CREATE USERS (upsert by email - unique constraint)
  // ============================================
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const usersData = [
    {
      email: 'admin@hotel.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN' as UserRole,
      hotelId: null,
      areaId: null,
    },
    {
      email: 'manager@hotel.com',
      name: 'Hotel Manager',
      role: 'HOTEL_ADMIN' as UserRole,
      hotelId: hotel.id,
      areaId: null,
    },
    {
      email: 'area@hotel.com',
      name: 'Area Manager - Restaurant',
      role: 'AREA_MANAGER' as UserRole,
      hotelId: hotel.id,
      areaId: areaRestaurant.id,
    },
  ];

  for (const userData of usersData) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: passwordHash,
        role: userData.role,
        areaId: userData.areaId,
        hotelId: userData.hotelId,
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
  // 4. CREATE DISPLAYS (auto-generated CUIDs)
  // ============================================
  const displays = await Promise.all([
    // LOBBY AREA
    prisma.display.create({
      data: {
        name: 'Lobby Main Display',
        location: 'Main Lobby - Entrance',
        hotelId: hotel.id,
        areaId: areaLobby.id,
        status: DisplayStatus.OFFLINE,
        lastSeen: new Date(),
      },
    }),
    prisma.display.create({
      data: {
        name: 'Reception Display',
        location: 'Reception Desk',
        hotelId: hotel.id,
        areaId: areaLobby.id,
        status: DisplayStatus.OFFLINE,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      },
    }),

    // RESTAURANT AREA
    prisma.display.create({
      data: {
        name: 'Restaurant Menu Board',
        location: 'Main Restaurant - Entrance',
        hotelId: hotel.id,
        areaId: areaRestaurant.id,
        status: DisplayStatus.OFFLINE,
        lastSeen: new Date(),
      },
    }),
    prisma.display.create({
      data: {
        name: 'Restaurant Buffet Display',
        location: 'Restaurant - Buffet Area',
        hotelId: hotel.id,
        areaId: areaRestaurant.id,
        status: DisplayStatus.OFFLINE,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    }),

    // POOL AREA
    prisma.display.create({
      data: {
        name: 'Pool Area Display',
        location: 'Swimming Pool - Bar Area',
        hotelId: hotel.id,
        areaId: areaPool.id,
        status: DisplayStatus.OFFLINE,
        lastSeen: new Date(),
      },
    }),
    prisma.display.create({
      data: {
        name: 'Pool Lounge Display',
        location: 'Pool Lounge Area',
        hotelId: hotel.id,
        areaId: areaPool.id,
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
  console.log(`  - Hotel: ${hotel.name} (ID: ${hotel.id})`);
  console.log(`  - Areas: ${areas.length}`);
  areas.forEach((area) => {
    console.log(`      • ${area.name} (ID: ${area.id})`);
  });
  console.log(`  - Users: ${usersData.length}`);
  console.log(`      • Super Admin: admin@hotel.com / Admin123!`);
  console.log(`      • Hotel Manager: manager@hotel.com / Admin123!`);
  console.log(`      • Area Manager: area@hotel.com / Admin123! (${areaRestaurant.name})`);
  console.log(`  - Displays: ${displays.length}`);
  console.log(`      • Online: ${displays.filter((d) => d.status === DisplayStatus.ONLINE).length}`);
  console.log(`      • Offline: ${displays.filter((d) => d.status === DisplayStatus.OFFLINE).length}`);
  console.log(`      • Error: ${displays.filter((d) => d.status === DisplayStatus.ERROR).length}`);
  console.log('\n🔐 RBAC Test Scenarios:');
  console.log('  - Super Admin can see ALL areas and displays');
  console.log('  - Hotel Manager can see ALL areas in their hotel');
  console.log(`  - Area Manager can ONLY see "${areaRestaurant.name}" and its 2 displays`);
  console.log('\n🔑 Generated IDs (use these in frontend if needed):');
  console.log(`  - Hotel ID: ${hotel.id}`);
  console.log(`  - Area IDs:`);
  areas.forEach((area) => {
    console.log(`      • ${area.name}: ${area.id}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
