import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env file
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const DEFAULT_HOTEL_ID = 'cm3yq5k7z0000l308wvqw7h8g';

async function main() {
  console.log('Creating default hotel...');

  const hotel = await prisma.hotel.upsert({
    where: { id: DEFAULT_HOTEL_ID },
    update: {},
    create: {
      id: DEFAULT_HOTEL_ID,
      name: 'Demo Hotel',
      address: '123 Demo Street, Demo City',
    },
  });

  console.log('✅ Default hotel created/verified:', hotel);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
