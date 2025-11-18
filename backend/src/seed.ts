import { prisma } from './db';

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.reviewItem.deleteMany();
  await prisma.reviewCampaign.deleteMany();
  await prisma.accessGrant.deleteMany();
  await prisma.principal.deleteMany();
  await prisma.systemResource.deleteMany();

  // Create systems
  console.log('Creating systems...');
  const salesforce = await prisma.systemResource.create({
    data: {
      name: 'Salesforce CRM',
      type: 'APP',
      description: 'Customer relationship management system',
    },
  });

  const dataWarehouse = await prisma.systemResource.create({
    data: {
      name: 'Analytics Data Warehouse',
      type: 'DB',
      description: 'PostgreSQL data warehouse',
    },
  });

  const awsProduction = await prisma.systemResource.create({
    data: {
      name: 'AWS Production',
      type: 'OTHER',
      description: 'AWS production environment',
    },
  });

  // Create principals
  console.log('Creating principals...');
  const alice = await prisma.principal.create({
    data: {
      externalId: 'alice@company.com',
      name: 'Alice Johnson',
      email: 'alice@company.com',
    },
  });

  const bob = await prisma.principal.create({
    data: {
      externalId: 'bob@company.com',
      name: 'Bob Smith',
      email: 'bob@company.com',
    },
  });

  const carol = await prisma.principal.create({
    data: {
      externalId: 'carol@company.com',
      name: 'Carol Williams',
      email: 'carol@company.com',
    },
  });

  const dave = await prisma.principal.create({
    data: {
      externalId: 'dave@company.com',
      name: 'Dave Brown',
      email: 'dave@company.com',
    },
  });

  // Create access grants
  console.log('Creating access grants...');
  await prisma.accessGrant.create({
    data: {
      systemId: salesforce.id,
      principalId: alice.id,
      role: 'Sales Manager',
      grantedAt: new Date('2024-01-15'),
      metaJson: { department: 'Sales', team: 'Enterprise' },
    },
  });

  await prisma.accessGrant.create({
    data: {
      systemId: salesforce.id,
      principalId: bob.id,
      role: 'Sales Rep',
      grantedAt: new Date('2024-02-01'),
      metaJson: { department: 'Sales', team: 'SMB' },
    },
  });

  await prisma.accessGrant.create({
    data: {
      systemId: dataWarehouse.id,
      principalId: alice.id,
      role: 'Analyst',
      grantedAt: new Date('2024-01-20'),
      metaJson: { accessLevel: 'read-write' },
    },
  });

  await prisma.accessGrant.create({
    data: {
      systemId: dataWarehouse.id,
      principalId: carol.id,
      role: 'Data Engineer',
      grantedAt: new Date('2024-03-01'),
      metaJson: { accessLevel: 'admin' },
    },
  });

  await prisma.accessGrant.create({
    data: {
      systemId: awsProduction.id,
      principalId: carol.id,
      role: 'DevOps Admin',
      grantedAt: new Date('2024-02-15'),
      metaJson: { services: ['EC2', 'RDS', 'S3'] },
    },
  });

  await prisma.accessGrant.create({
    data: {
      systemId: awsProduction.id,
      principalId: dave.id,
      role: 'Developer',
      grantedAt: new Date('2024-03-10'),
      metaJson: { services: ['EC2', 'S3'] },
    },
  });

  // Create a sample campaign
  console.log('Creating review campaign...');
  const campaign = await prisma.reviewCampaign.create({
    data: {
      name: 'Q1 2025 Access Review',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2025-03-31'),
      status: 'DRAFT',
    },
  });

  console.log('\n✓ Seed completed successfully!');
  console.log('\nCreated:');
  console.log('  - 3 System Resources');
  console.log('  - 4 Principals');
  console.log('  - 6 Access Grants');
  console.log('  - 1 Review Campaign (DRAFT)');
  console.log(`\nCampaign ID: ${campaign.id}`);
  console.log('\nNext steps:');
  console.log('1. Generate review items: POST /campaigns/{id}/generate-items');
  console.log('2. View pending reviews: GET /reviews?reviewerEmail=alice@company.com');
  console.log('3. Make review decisions: PUT /reviews/{itemId}?reviewerEmail=alice@company.com');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
