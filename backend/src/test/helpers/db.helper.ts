import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
    },
  },
});

export async function cleanDatabase() {
  await testPrisma.reviewItem.deleteMany();
  await testPrisma.reviewCampaign.deleteMany();
  await testPrisma.accessGrant.deleteMany();
  await testPrisma.principal.deleteMany();
  await testPrisma.systemResource.deleteMany();
}

export async function disconnectDatabase() {
  await testPrisma.$disconnect();
}
