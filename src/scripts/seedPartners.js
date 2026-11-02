// backend/scripts/seedPartners.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PARTNERS = [
  { name: 'Partner 1', code: 'RT1A9K2B' },
  { name: 'Partner 2', code: 'RT2X7M4P' },
  { name: 'Partner 3', code: 'RT3B6N1Q' },
  { name: 'Partner 4', code: 'RT4Y2D8R' },
  { name: 'Partner 5', code: 'RT5K9W3S' },
  { name: 'Partner 6', code: 'RT6M4J7T' },
  { name: 'Partner 7', code: 'RT7P1L5U' },
  { name: 'Partner 8', code: 'RT8Q8H2V' },
  { name: 'Partner 9', code: 'RT9Z3F6W' },
  { name: 'Partner 10', code: 'RT0C7G4X' },
];

async function main() {
  for (const p of PARTNERS) {
    const partner = await prisma.partner.upsert({
      where: { email: `${p.code.toLowerCase()}@partner.fpoojas.com` },
      update: {},
      create: {
        name: p.name,
        email: `${p.code.toLowerCase()}@partner.fpoojas.com`,
        isActive: true,
      },
    });

    await prisma.redeemCode.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        partnerId: partner.id,
        discountPercent: 10,
        commissionPercent: 10,
        isActive: true,
      },
    });

    console.log(`✅ ${p.name} -> code: ${p.code}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });