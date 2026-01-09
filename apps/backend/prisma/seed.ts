/**
 * Database Seed Script - COMPLETO
 * 3 Hotels, 44 Displays, 11 Users, Sample Content
 */

import { PrismaClient, DisplayStatus, UserRole, ContentType, ContentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with complete test data...\n');

  // Clear existing data (in correct order due to foreign keys)
  console.log('🧹 Clearing existing data...');
  await prisma.displayContent.deleteMany();
  await prisma.playbackLog.deleteMany();
  await prisma.contentSourceChange.deleteMany();
  await prisma.displayStateHistory.deleteMany();
  await prisma.displayConfigHistory.deleteMany();
  await prisma.syncGroupDisplay.deleteMany();
  await prisma.syncGroupContent.deleteMany();
  await prisma.syncGroup.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.display.deleteMany();
  await prisma.content.deleteMany();
  await prisma.userActivityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.sessionLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.area.deleteMany();
  await prisma.hotel.deleteMany();
  console.log('✓ Data cleared\n');

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // ============================================
  // 1. CREATE 3 HOTELS
  // ============================================
  console.log('🏨 Creating hotels...');

  const hotel1 = await prisma.hotel.create({
    data: {
      name: 'Grand Hotel Plaza',
      address: '123 Main Street, Downtown, Mexico City 06600',
    },
  });

  const hotel2 = await prisma.hotel.create({
    data: {
      name: 'Seaside Resort & Spa',
      address: '456 Beach Boulevard, Cancun, QR 77500',
    },
  });

  const hotel3 = await prisma.hotel.create({
    data: {
      name: 'Mountain View Lodge',
      address: '789 Sierra Drive, Valle de Bravo, MX 51200',
    },
  });

  console.log(`✓ Created 3 hotels`);
  console.log(`    - ${hotel1.name} (ID: ${hotel1.id})`);
  console.log(`    - ${hotel2.name} (ID: ${hotel2.id})`);
  console.log(`    - ${hotel3.name} (ID: ${hotel3.id})\n`);

  // ============================================
  // 2. CREATE AREAS FOR EACH HOTEL
  // ============================================
  console.log('🗺️ Creating areas...');

  // Hotel 1 - Grand Hotel Plaza (6 areas)
  const h1Areas = await Promise.all([
    prisma.area.create({ data: { name: 'Lobby Principal', description: 'Área de recepción principal', hotelId: hotel1.id } }),
    prisma.area.create({ data: { name: 'Restaurante Buffet', description: 'Restaurante principal', hotelId: hotel1.id } }),
    prisma.area.create({ data: { name: 'Zona Piscina', description: 'Área de alberca y bar', hotelId: hotel1.id } }),
    prisma.area.create({ data: { name: 'Gimnasio', description: 'Centro de fitness', hotelId: hotel1.id } }),
    prisma.area.create({ data: { name: 'Salón de Eventos', description: 'Salones para conferencias', hotelId: hotel1.id } }),
    prisma.area.create({ data: { name: 'Spa & Wellness', description: 'Área de relajación', hotelId: hotel1.id } }),
  ]);

  // Hotel 2 - Seaside Resort (5 areas)
  const h2Areas = await Promise.all([
    prisma.area.create({ data: { name: 'Recepción', description: 'Lobby y check-in', hotelId: hotel2.id } }),
    prisma.area.create({ data: { name: 'Restaurante Mar Azul', description: 'Restaurante con vista al mar', hotelId: hotel2.id } }),
    prisma.area.create({ data: { name: 'Beach Club', description: 'Club de playa', hotelId: hotel2.id } }),
    prisma.area.create({ data: { name: 'Kids Club', description: 'Área infantil', hotelId: hotel2.id } }),
    prisma.area.create({ data: { name: 'Centro de Convenciones', description: 'Área para eventos corporativos', hotelId: hotel2.id } }),
  ]);

  // Hotel 3 - Mountain View (4 areas)
  const h3Areas = await Promise.all([
    prisma.area.create({ data: { name: 'Lobby Montaña', description: 'Recepción con chimenea', hotelId: hotel3.id } }),
    prisma.area.create({ data: { name: 'Restaurante Fogón', description: 'Cocina tradicional', hotelId: hotel3.id } }),
    prisma.area.create({ data: { name: 'Terraza Panorámica', description: 'Vista al valle', hotelId: hotel3.id } }),
    prisma.area.create({ data: { name: 'Centro Ecuestre', description: 'Caballerizas y paseos', hotelId: hotel3.id } }),
  ]);

  const allAreas = [...h1Areas, ...h2Areas, ...h3Areas];
  console.log(`✓ Created ${allAreas.length} areas across all hotels\n`);

  // ============================================
  // 3. CREATE 11 USERS
  // ============================================
  console.log('👥 Creating users...');

  const users = [
    // 1 Super Admin (sin hotel)
    { email: 'admin@signage.com', name: 'Super Admin', role: UserRole.SUPER_ADMIN, hotelId: null, areaId: null },

    // 3 Hotel Admins (uno por hotel)
    { email: 'manager@grandhotel.com', name: 'Carlos Mendoza', role: UserRole.HOTEL_ADMIN, hotelId: hotel1.id, areaId: null },
    { email: 'manager@seaside.com', name: 'María García', role: UserRole.HOTEL_ADMIN, hotelId: hotel2.id, areaId: null },
    { email: 'manager@mountainview.com', name: 'Roberto López', role: UserRole.HOTEL_ADMIN, hotelId: hotel3.id, areaId: null },

    // 7 Area Managers (distribuidos)
    { email: 'lobby@grandhotel.com', name: 'Ana Rodríguez', role: UserRole.AREA_MANAGER, hotelId: hotel1.id, areaId: h1Areas[0].id },
    { email: 'restaurant@grandhotel.com', name: 'Luis Hernández', role: UserRole.AREA_MANAGER, hotelId: hotel1.id, areaId: h1Areas[1].id },
    { email: 'pool@grandhotel.com', name: 'Patricia Sánchez', role: UserRole.AREA_MANAGER, hotelId: hotel1.id, areaId: h1Areas[2].id },
    { email: 'reception@seaside.com', name: 'Fernando Torres', role: UserRole.AREA_MANAGER, hotelId: hotel2.id, areaId: h2Areas[0].id },
    { email: 'beach@seaside.com', name: 'Carmen Flores', role: UserRole.AREA_MANAGER, hotelId: hotel2.id, areaId: h2Areas[2].id },
    { email: 'lobby@mountainview.com', name: 'Diego Ramírez', role: UserRole.AREA_MANAGER, hotelId: hotel3.id, areaId: h3Areas[0].id },
    { email: 'restaurant@mountainview.com', name: 'Sofia Vega', role: UserRole.AREA_MANAGER, hotelId: hotel3.id, areaId: h3Areas[1].id },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: { password: passwordHash, role: userData.role, hotelId: userData.hotelId, areaId: userData.areaId },
      create: { ...userData, password: passwordHash, twoFactorEnabled: false },
    });
  }

  console.log(`✓ Created ${users.length} users`);
  console.log('    Credentials: [email] / Admin123!\n');

  // ============================================
  // 4. CREATE SAMPLE CONTENT
  // ============================================
  console.log('📺 Creating sample content...');

  // Content for Hotel 1
  const h1Contents = await Promise.all([
    prisma.content.create({
      data: {
        name: 'Video Bienvenida Grand Hotel',
        type: ContentType.VIDEO,
        status: ContentStatus.READY,
        originalUrl: '/storage/videos/welcome-grand.mp4',
        thumbnailUrl: '/storage/thumbnails/welcome-grand.jpg',
        duration: 30,
        resolution: '1920x1080',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        orientation: 'horizontal',
        hotelId: hotel1.id,
      },
    }),
    prisma.content.create({
      data: {
        name: 'Menú Restaurante',
        type: ContentType.IMAGE,
        status: ContentStatus.READY,
        originalUrl: '/storage/images/menu-buffet.jpg',
        thumbnailUrl: '/storage/thumbnails/menu-buffet.jpg',
        resolution: '1080x1920',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        orientation: 'vertical',
        hotelId: hotel1.id,
      },
    }),
    prisma.content.create({
      data: {
        name: 'Promoción Spa',
        type: ContentType.IMAGE,
        status: ContentStatus.READY,
        originalUrl: '/storage/images/spa-promo.jpg',
        thumbnailUrl: '/storage/thumbnails/spa-promo.jpg',
        resolution: '1920x1080',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        orientation: 'horizontal',
        hotelId: hotel1.id,
      },
    }),
    prisma.content.create({
      data: {
        name: 'Horarios Gimnasio',
        type: ContentType.IMAGE,
        status: ContentStatus.READY,
        originalUrl: '/storage/images/gym-schedule.jpg',
        thumbnailUrl: '/storage/thumbnails/gym-schedule.jpg',
        resolution: '1920x1080',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        orientation: 'horizontal',
        hotelId: hotel1.id,
      },
    }),
  ]);

  // Content for Hotel 2
  const h2Contents = await Promise.all([
    prisma.content.create({
      data: {
        name: 'Video Bienvenida Seaside',
        type: ContentType.VIDEO,
        status: ContentStatus.READY,
        originalUrl: '/storage/videos/welcome-seaside.mp4',
        thumbnailUrl: '/storage/thumbnails/welcome-seaside.jpg',
        duration: 45,
        resolution: '3840x2160',
        width: 3840,
        height: 2160,
        aspectRatio: '16:9',
        orientation: 'horizontal',
        hotelId: hotel2.id,
      },
    }),
    prisma.content.create({
      data: {
        name: 'Menú Beach Club',
        type: ContentType.IMAGE,
        status: ContentStatus.READY,
        originalUrl: '/storage/images/beach-menu.jpg',
        thumbnailUrl: '/storage/thumbnails/beach-menu.jpg',
        resolution: '1920x1080',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        orientation: 'horizontal',
        hotelId: hotel2.id,
      },
    }),
    prisma.content.create({
      data: {
        name: 'Actividades Kids Club',
        type: ContentType.VIDEO,
        status: ContentStatus.READY,
        originalUrl: '/storage/videos/kids-activities.mp4',
        thumbnailUrl: '/storage/thumbnails/kids-activities.jpg',
        duration: 60,
        resolution: '1920x1080',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        orientation: 'horizontal',
        hotelId: hotel2.id,
      },
    }),
  ]);

  // Content for Hotel 3
  const h3Contents = await Promise.all([
    prisma.content.create({
      data: {
        name: 'Video Paisaje Montaña',
        type: ContentType.VIDEO,
        status: ContentStatus.READY,
        originalUrl: '/storage/videos/mountain-landscape.mp4',
        thumbnailUrl: '/storage/thumbnails/mountain-landscape.jpg',
        duration: 120,
        resolution: '3840x2160',
        width: 3840,
        height: 2160,
        aspectRatio: '16:9',
        orientation: 'horizontal',
        hotelId: hotel3.id,
      },
    }),
    prisma.content.create({
      data: {
        name: 'Menú Fogón',
        type: ContentType.IMAGE,
        status: ContentStatus.READY,
        originalUrl: '/storage/images/fogon-menu.jpg',
        thumbnailUrl: '/storage/thumbnails/fogon-menu.jpg',
        resolution: '1080x1920',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        orientation: 'vertical',
        hotelId: hotel3.id,
      },
    }),
  ]);

  const allContent = [...h1Contents, ...h2Contents, ...h3Contents];
  console.log(`✓ Created ${allContent.length} content items\n`);

  // ============================================
  // 5. CREATE 44 DISPLAYS (distributed across hotels and areas)
  // ============================================
  console.log('📺 Creating 44 displays...');

  interface DisplayConfig {
    name: string;
    location: string;
    hotelId: string;
    areaId: string;
    status: DisplayStatus;
    orientation: string;
    resolution: string;
  }

  const displayConfigs: DisplayConfig[] = [];

  // Hotel 1 - Grand Hotel Plaza (18 displays)
  // Lobby (4)
  displayConfigs.push(
    { name: 'Lobby Main Screen', location: 'Entrance Hall', hotelId: hotel1.id, areaId: h1Areas[0].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
    { name: 'Reception Desk Left', location: 'Reception Area', hotelId: hotel1.id, areaId: h1Areas[0].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Reception Desk Right', location: 'Reception Area', hotelId: hotel1.id, areaId: h1Areas[0].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Elevator Hall Screen', location: 'Near Elevators', hotelId: hotel1.id, areaId: h1Areas[0].id, status: DisplayStatus.OFFLINE, orientation: 'horizontal', resolution: '1920x1080' },
  );
  // Restaurant (4)
  displayConfigs.push(
    { name: 'Restaurant Menu Board', location: 'Restaurant Entrance', hotelId: hotel1.id, areaId: h1Areas[1].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Buffet Display 1', location: 'Buffet Section A', hotelId: hotel1.id, areaId: h1Areas[1].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Buffet Display 2', location: 'Buffet Section B', hotelId: hotel1.id, areaId: h1Areas[1].id, status: DisplayStatus.ERROR, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Bar Menu Screen', location: 'Restaurant Bar', hotelId: hotel1.id, areaId: h1Areas[1].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
  );
  // Pool (3)
  displayConfigs.push(
    { name: 'Pool Bar Menu', location: 'Pool Bar', hotelId: hotel1.id, areaId: h1Areas[2].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Pool Schedule Display', location: 'Pool Entrance', hotelId: hotel1.id, areaId: h1Areas[2].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Towel Station Screen', location: 'Towel Station', hotelId: hotel1.id, areaId: h1Areas[2].id, status: DisplayStatus.OFFLINE, orientation: 'horizontal', resolution: '1920x1080' },
  );
  // Gym (2)
  displayConfigs.push(
    { name: 'Gym Schedule Board', location: 'Gym Entrance', hotelId: hotel1.id, areaId: h1Areas[3].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Cardio Area Display', location: 'Cardio Section', hotelId: hotel1.id, areaId: h1Areas[3].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
  );
  // Events (3)
  displayConfigs.push(
    { name: 'Events Directory', location: 'Convention Center Lobby', hotelId: hotel1.id, areaId: h1Areas[4].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Salon A Screen', location: 'Salon A Entrance', hotelId: hotel1.id, areaId: h1Areas[4].id, status: DisplayStatus.OFFLINE, orientation: 'horizontal', resolution: '3840x2160' },
    { name: 'Salon B Screen', location: 'Salon B Entrance', hotelId: hotel1.id, areaId: h1Areas[4].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
  );
  // Spa (2)
  displayConfigs.push(
    { name: 'Spa Services Menu', location: 'Spa Reception', hotelId: hotel1.id, areaId: h1Areas[5].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Relaxation Room Display', location: 'Relaxation Area', hotelId: hotel1.id, areaId: h1Areas[5].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
  );

  // Hotel 2 - Seaside Resort (16 displays)
  // Reception (3)
  displayConfigs.push(
    { name: 'Main Lobby Screen', location: 'Reception Hall', hotelId: hotel2.id, areaId: h2Areas[0].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
    { name: 'Check-in Kiosk Left', location: 'Check-in Area', hotelId: hotel2.id, areaId: h2Areas[0].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Check-in Kiosk Right', location: 'Check-in Area', hotelId: hotel2.id, areaId: h2Areas[0].id, status: DisplayStatus.ERROR, orientation: 'vertical', resolution: '1080x1920' },
  );
  // Restaurant (4)
  displayConfigs.push(
    { name: 'Mar Azul Menu', location: 'Restaurant Entrance', hotelId: hotel2.id, areaId: h2Areas[1].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Ocean View Display', location: 'Dining Room', hotelId: hotel2.id, areaId: h2Areas[1].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
    { name: 'Terrace Screen', location: 'Outdoor Terrace', hotelId: hotel2.id, areaId: h2Areas[1].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Sushi Bar Display', location: 'Sushi Station', hotelId: hotel2.id, areaId: h2Areas[1].id, status: DisplayStatus.OFFLINE, orientation: 'horizontal', resolution: '1920x1080' },
  );
  // Beach Club (4)
  displayConfigs.push(
    { name: 'Beach Bar Menu', location: 'Beach Bar', hotelId: hotel2.id, areaId: h2Areas[2].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Activities Board', location: 'Activity Center', hotelId: hotel2.id, areaId: h2Areas[2].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'DJ Booth Screen', location: 'Pool Party Area', hotelId: hotel2.id, areaId: h2Areas[2].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
    { name: 'Cabana Info', location: 'Cabana Area', hotelId: hotel2.id, areaId: h2Areas[2].id, status: DisplayStatus.OFFLINE, orientation: 'horizontal', resolution: '1920x1080' },
  );
  // Kids Club (3)
  displayConfigs.push(
    { name: 'Kids Activities Screen', location: 'Kids Club Entrance', hotelId: hotel2.id, areaId: h2Areas[3].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Game Room Display', location: 'Game Room', hotelId: hotel2.id, areaId: h2Areas[3].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Movie Room Screen', location: 'Movie Room', hotelId: hotel2.id, areaId: h2Areas[3].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
  );
  // Convention Center (2)
  displayConfigs.push(
    { name: 'Convention Schedule', location: 'Convention Lobby', hotelId: hotel2.id, areaId: h2Areas[4].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Main Hall Screen', location: 'Main Convention Hall', hotelId: hotel2.id, areaId: h2Areas[4].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
  );

  // Hotel 3 - Mountain View (10 displays)
  // Lobby (3)
  displayConfigs.push(
    { name: 'Mountain Welcome', location: 'Main Lodge Entrance', hotelId: hotel3.id, areaId: h3Areas[0].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
    { name: 'Fireplace Display', location: 'Fireplace Lounge', hotelId: hotel3.id, areaId: h3Areas[0].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Concierge Screen', location: 'Concierge Desk', hotelId: hotel3.id, areaId: h3Areas[0].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
  );
  // Restaurant (3)
  displayConfigs.push(
    { name: 'Fogón Menu Board', location: 'Restaurant Entrance', hotelId: hotel3.id, areaId: h3Areas[1].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Wine Cellar Display', location: 'Wine Room', hotelId: hotel3.id, areaId: h3Areas[1].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
    { name: 'Private Dining Screen', location: 'Private Dining Room', hotelId: hotel3.id, areaId: h3Areas[1].id, status: DisplayStatus.ERROR, orientation: 'horizontal', resolution: '1920x1080' },
  );
  // Terrace (2)
  displayConfigs.push(
    { name: 'Panoramic Info', location: 'Terrace Viewpoint', hotelId: hotel3.id, areaId: h3Areas[2].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '3840x2160' },
    { name: 'Sunset Lounge Screen', location: 'Sunset Lounge', hotelId: hotel3.id, areaId: h3Areas[2].id, status: DisplayStatus.OFFLINE, orientation: 'horizontal', resolution: '1920x1080' },
  );
  // Equestrian (2)
  displayConfigs.push(
    { name: 'Stable Schedule', location: 'Stable Entrance', hotelId: hotel3.id, areaId: h3Areas[3].id, status: DisplayStatus.ONLINE, orientation: 'vertical', resolution: '1080x1920' },
    { name: 'Trail Map Display', location: 'Trail Head', hotelId: hotel3.id, areaId: h3Areas[3].id, status: DisplayStatus.ONLINE, orientation: 'horizontal', resolution: '1920x1080' },
  );

  // Create all displays
  interface DisplayRecord {
    id: string;
    name: string;
    location: string;
    hotelId: string;
    status: DisplayStatus;
  }

  const displays: DisplayRecord[] = [];
  for (const config of displayConfigs) {
    const display = await prisma.display.create({
      data: {
        name: config.name,
        location: config.location,
        hotelId: config.hotelId,
        areaId: config.areaId,
        status: config.status,
        orientation: config.orientation,
        resolution: config.resolution,
        lastSeen: config.status === DisplayStatus.ONLINE ? new Date() : new Date(Date.now() - Math.random() * 86400000),
        // Add error info for ERROR status displays
        ...(config.status === DisplayStatus.ERROR && {
          lastError: 'Connection timeout - device not responding',
          lastErrorCode: 'CONNECTION_LOST',
          lastErrorAt: new Date(Date.now() - Math.random() * 3600000),
          errorCount: Math.floor(Math.random() * 5) + 1,
        }),
      },
    });
    displays.push(display);
  }

  console.log(`✓ Created ${displays.length} displays`);
  console.log(`    - Online: ${displays.filter(d => d.status === DisplayStatus.ONLINE).length}`);
  console.log(`    - Offline: ${displays.filter(d => d.status === DisplayStatus.OFFLINE).length}`);
  console.log(`    - Error: ${displays.filter(d => d.status === DisplayStatus.ERROR).length}\n`);

  // ============================================
  // 6. ASSIGN CONTENT TO DISPLAYS (Playlists)
  // ============================================
  console.log('🎬 Assigning content to displays...');

  // Assign content to Hotel 1 displays
  const h1Displays = displays.filter(d => d.hotelId === hotel1.id && d.status === DisplayStatus.ONLINE);
  for (let i = 0; i < Math.min(h1Displays.length, h1Contents.length * 3); i++) {
    await prisma.displayContent.create({
      data: {
        displayId: h1Displays[i].id,
        contentId: h1Contents[i % h1Contents.length].id,
        order: 0,
      },
    });
  }

  // Assign content to Hotel 2 displays
  const h2Displays = displays.filter(d => d.hotelId === hotel2.id && d.status === DisplayStatus.ONLINE);
  for (let i = 0; i < Math.min(h2Displays.length, h2Contents.length * 3); i++) {
    await prisma.displayContent.create({
      data: {
        displayId: h2Displays[i].id,
        contentId: h2Contents[i % h2Contents.length].id,
        order: 0,
      },
    });
  }

  // Assign content to Hotel 3 displays
  const h3Displays = displays.filter(d => d.hotelId === hotel3.id && d.status === DisplayStatus.ONLINE);
  for (let i = 0; i < Math.min(h3Displays.length, h3Contents.length * 3); i++) {
    await prisma.displayContent.create({
      data: {
        displayId: h3Displays[i].id,
        contentId: h3Contents[i % h3Contents.length].id,
        order: 0,
      },
    });
  }

  const assignedCount = Math.min(h1Displays.length, h1Contents.length * 3) +
    Math.min(h2Displays.length, h2Contents.length * 3) +
    Math.min(h3Displays.length, h3Contents.length * 3);
  console.log(`✓ Assigned content to ${assignedCount} displays\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 DATA SUMMARY:');
  console.log(`   Hotels:    3`);
  console.log(`   Areas:     ${allAreas.length}`);
  console.log(`   Users:     ${users.length}`);
  console.log(`   Displays:  ${displays.length}`);
  console.log(`   Content:   ${allContent.length}`);
  console.log(`   Playlists: ${assignedCount}\n`);

  console.log('🔐 TEST ACCOUNTS (Password: Admin123!):');
  console.log('   ┌────────────────────────────────────────────────────┐');
  console.log('   │ Super Admin:                                       │');
  console.log('   │   admin@signage.com                                │');
  console.log('   │                                                    │');
  console.log('   │ Hotel Admins:                                      │');
  console.log('   │   manager@grandhotel.com (Grand Hotel Plaza)       │');
  console.log('   │   manager@seaside.com (Seaside Resort & Spa)       │');
  console.log('   │   manager@mountainview.com (Mountain View Lodge)   │');
  console.log('   │                                                    │');
  console.log('   │ Area Managers:                                     │');
  console.log('   │   lobby@grandhotel.com (Lobby Principal)           │');
  console.log('   │   restaurant@grandhotel.com (Restaurante Buffet)   │');
  console.log('   │   pool@grandhotel.com (Zona Piscina)               │');
  console.log('   │   reception@seaside.com (Recepción)                │');
  console.log('   │   beach@seaside.com (Beach Club)                   │');
  console.log('   │   lobby@mountainview.com (Lobby Montaña)           │');
  console.log('   │   restaurant@mountainview.com (Restaurante Fogón)  │');
  console.log('   └────────────────────────────────────────────────────┘\n');

  console.log('🖥️  TO TEST A DISPLAY IN PLAYER:');
  console.log(`   http://localhost:3002/?displayId=${displays[0].id}`);
  console.log(`   (${displays[0].name} - ${displays[0].location})\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
