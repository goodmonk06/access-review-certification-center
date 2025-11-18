import { prisma } from './db';
import { auditService } from './services/audit.service';

async function seedComprehensive() {
  console.log('🌱 Seeding comprehensive dataset...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.complianceReport.deleteMany();
  await prisma.systemIntegration.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.delegation.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.reviewCampaign.deleteMany();
  await prisma.reviewTemplate.deleteMany();
  await prisma.accessRequest.deleteMany();
  await prisma.accessGrant.deleteMany();
  await prisma.principal.deleteMany();
  await prisma.systemResource.deleteMany();

  // Create systems with rich metadata
  console.log('Creating systems...');
  const systems = {
    salesforce: await prisma.systemResource.create({
      data: {
        name: 'Salesforce CRM',
        type: 'APP',
        description: 'Customer relationship management system',
        owner: 'sales-ops@company.com',
        riskLevel: 'HIGH',
        tags: ['sales', 'crm', 'customer-data'],
        metadata: { vendor: 'Salesforce', ssoEnabled: true },
        isActive: true,
      },
    }),
    github: await prisma.systemResource.create({
      data: {
        name: 'GitHub Enterprise',
        type: 'APP',
        description: 'Source code repository',
        owner: 'engineering@company.com',
        riskLevel: 'CRITICAL',
        tags: ['engineering', 'source-code', 'cicd'],
        metadata: { scmType: 'git', privateRepos: true },
        isActive: true,
      },
    }),
    dataWarehouse: await prisma.systemResource.create({
      data: {
        name: 'Analytics Data Warehouse',
        type: 'DB',
        description: 'PostgreSQL data warehouse with PII',
        owner: 'data-team@company.com',
        riskLevel: 'CRITICAL',
        tags: ['database', 'analytics', 'pii'],
        metadata: { dbType: 'postgresql', encryption: 'at-rest' },
        isActive: true,
      },
    }),
    aws: await prisma.systemResource.create({
      data: {
        name: 'AWS Production',
        type: 'CLOUD',
        description: 'AWS production environment',
        owner: 'devops@company.com',
        riskLevel: 'CRITICAL',
        tags: ['cloud', 'infrastructure', 'production'],
        metadata: { provider: 'aws', regions: ['us-east-1', 'eu-west-1'] },
        isActive: true,
      },
    }),
    jira: await prisma.systemResource.create({
      data: {
        name: 'Jira',
        type: 'APP',
        description: 'Project management and issue tracking',
        owner: 'product@company.com',
        riskLevel: 'MEDIUM',
        tags: ['project-management', 'agile'],
        isActive: true,
      },
    }),
    confluence: await prisma.systemResource.create({
      data: {
        name: 'Confluence',
        type: 'APP',
        description: 'Team collaboration and documentation',
        owner: 'it@company.com',
        riskLevel: 'LOW',
        tags: ['documentation', 'knowledge-base'],
        isActive: true,
      },
    }),
  };

  // Create principals with organizational hierarchy
  console.log('Creating principals...');
  const principals = {
    ceo: await prisma.principal.create({
      data: {
        externalId: 'ceo@company.com',
        name: 'Sarah Thompson',
        email: 'ceo@company.com',
        department: 'Executive',
        title: 'Chief Executive Officer',
        isActive: true,
      },
    }),
    cto: await prisma.principal.create({
      data: {
        externalId: 'cto@company.com',
        name: 'Michael Chen',
        email: 'cto@company.com',
        department: 'Engineering',
        title: 'Chief Technology Officer',
        managerId: 'ceo@company.com',
        isActive: true,
      },
    }),
    alice: await prisma.principal.create({
      data: {
        externalId: 'alice@company.com',
        name: 'Alice Johnson',
        email: 'alice@company.com',
        department: 'Sales',
        title: 'Sales Manager',
        managerId: 'ceo@company.com',
        isActive: true,
      },
    }),
    bob: await prisma.principal.create({
      data: {
        externalId: 'bob@company.com',
        name: 'Bob Smith',
        email: 'bob@company.com',
        department: 'Engineering',
        title: 'Senior Software Engineer',
        managerId: 'cto@company.com',
        isActive: true,
      },
    }),
    carol: await prisma.principal.create({
      data: {
        externalId: 'carol@company.com',
        name: 'Carol Williams',
        email: 'carol@company.com',
        department: 'Data',
        title: 'Data Engineer',
        managerId: 'cto@company.com',
        isActive: true,
      },
    }),
    dave: await prisma.principal.create({
      data: {
        externalId: 'dave@company.com',
        name: 'Dave Brown',
        email: 'dave@company.com',
        department: 'Engineering',
        title: 'DevOps Engineer',
        managerId: 'cto@company.com',
        isActive: true,
      },
    }),
    eve: await prisma.principal.create({
      data: {
        externalId: 'eve@company.com',
        name: 'Eve Martinez',
        email: 'eve@company.com',
        department: 'Sales',
        title: 'Sales Representative',
        managerId: 'alice@company.com',
        isActive: true,
      },
    }),
    frank: await prisma.principal.create({
      data: {
        externalId: 'frank@company.com',
        name: 'Frank Lee',
        email: 'frank@company.com',
        department: 'Product',
        title: 'Product Manager',
        managerId: 'ceo@company.com',
        isActive: true,
      },
    }),
  };

  // Create access grants
  console.log('Creating access grants...');
  const grants = await Promise.all([
    // Alice - Sales Manager
    prisma.accessGrant.create({
      data: {
        systemId: systems.salesforce.id,
        principalId: principals.alice.id,
        role: 'Admin',
        source: 'MANUAL',
        grantedAt: new Date('2024-01-15'),
        metaJson: { department: 'Sales', level: 'manager' },
        isActive: true,
      },
    }),
    prisma.accessGrant.create({
      data: {
        systemId: systems.jira.id,
        principalId: principals.alice.id,
        role: 'Project Admin',
        source: 'MANUAL',
        grantedAt: new Date('2024-01-15'),
        isActive: true,
      },
    }),
    // Bob - Senior Engineer
    prisma.accessGrant.create({
      data: {
        systemId: systems.github.id,
        principalId: principals.bob.id,
        role: 'Maintainer',
        source: 'IMPORTED',
        grantedAt: new Date('2024-02-01'),
        metaJson: { teams: ['platform', 'backend'] },
        isActive: true,
      },
    }),
    prisma.accessGrant.create({
      data: {
        systemId: systems.aws.id,
        principalId: principals.bob.id,
        role: 'Developer',
        source: 'MANUAL',
        grantedAt: new Date('2024-02-15'),
        metaJson: { services: ['EC2', 'RDS', 'S3'] },
        isActive: true,
      },
    }),
    // Carol - Data Engineer
    prisma.accessGrant.create({
      data: {
        systemId: systems.dataWarehouse.id,
        principalId: principals.carol.id,
        role: 'Admin',
        source: 'MANUAL',
        grantedAt: new Date('2024-03-01'),
        metaJson: { accessLevel: 'full', piiAccess: true },
        isActive: true,
      },
    }),
    prisma.accessGrant.create({
      data: {
        systemId: systems.github.id,
        principalId: principals.carol.id,
        role: 'Write',
        source: 'IMPORTED',
        grantedAt: new Date('2024-03-01'),
        isActive: true,
      },
    }),
    // Dave - DevOps
    prisma.accessGrant.create({
      data: {
        systemId: systems.aws.id,
        principalId: principals.dave.id,
        role: 'PowerUser',
        source: 'MANUAL',
        grantedAt: new Date('2024-03-10'),
        metaJson: { services: ['EC2', 'RDS', 'S3', 'Lambda', 'CloudWatch'] },
        isActive: true,
      },
    }),
    prisma.accessGrant.create({
      data: {
        systemId: systems.github.id,
        principalId: principals.dave.id,
        role: 'Admin',
        source: 'MANUAL',
        grantedAt: new Date('2024-03-10'),
        isActive: true,
      },
    }),
    // Eve - Sales Rep
    prisma.accessGrant.create({
      data: {
        systemId: systems.salesforce.id,
        principalId: principals.eve.id,
        role: 'User',
        source: 'AUTOMATED',
        grantedAt: new Date('2024-04-01'),
        isActive: true,
      },
    }),
  ]);

  // Create review templates
  console.log('Creating review templates...');
  const templates = {
    criticalSystems: await prisma.reviewTemplate.create({
      data: {
        name: 'Critical Systems Review',
        description: 'Enhanced review process for critical systems',
        questions: {
          businessJustification: 'Why is this access still required?',
          alternateAccess: 'Could this user perform their duties with reduced access?',
          lastUsed: 'When was this access last used?',
        },
        rules: {
          requireManagerApproval: true,
          maxAccessDuration: '90 days',
        },
        targetSystems: [],
        targetRoles: [],
        riskLevel: 'CRITICAL',
        requireComment: true,
        isActive: true,
      },
    }),
    standardReview: await prisma.reviewTemplate.create({
      data: {
        name: 'Standard Quarterly Review',
        description: 'Standard review for regular systems',
        questions: {
          stillNeeded: 'Is this access still needed?',
        },
        riskLevel: 'MEDIUM',
        requireComment: false,
        isActive: true,
      },
    }),
  };

  // Create review campaign
  console.log('Creating review campaign...');
  const campaign = await prisma.reviewCampaign.create({
    data: {
      name: 'Q1 2025 Quarterly Access Review',
      description: 'Comprehensive quarterly review of all access grants',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-03-31'),
      status: 'ACTIVE',
      templateId: templates.standardReview.id,
      autoReminder: true,
      reminderDays: 7,
    },
  });

  // Generate review items
  console.log('Creating review items...');
  for (const grant of grants) {
    await prisma.reviewItem.create({
      data: {
        campaignId: campaign.id,
        accessGrantId: grant.id,
        reviewerEmail: principals.alice.email, // In reality, would be manager
        decision: 'PENDING',
        priority: grant.isActive ? 'MEDIUM' : 'LOW',
      },
    });
  }

  // Create some access requests
  console.log('Creating access requests...');
  const accessRequest = await prisma.accessRequest.create({
    data: {
      systemId: systems.dataWarehouse.id,
      requesterId: principals.bob.id,
      role: 'Analyst',
      justification: 'Need read access to analytics data for dashboard development',
      urgency: 'HIGH',
      status: 'PENDING',
    },
  });

  // Create audit logs
  console.log('Creating audit logs...');
  await auditService.log({
    actor: principals.alice.email,
    action: 'CAMPAIGN_CREATED',
    target: campaign.id,
    targetType: 'ReviewCampaign',
    details: { name: campaign.name },
  });

  await auditService.log({
    actor: principals.bob.email,
    action: 'REQUEST_CREATED',
    target: accessRequest.id,
    targetType: 'AccessRequest',
    details: { systemId: systems.dataWarehouse.id, role: 'Analyst' },
  });

  console.log('\n✓ Comprehensive seed completed successfully!');
  console.log('\nCreated:');
  console.log(`  - ${Object.keys(systems).length} Systems (with risk levels and tags)`);
  console.log(`  - ${Object.keys(principals).length} Principals (with org hierarchy)`);
  console.log(`  - ${grants.length} Access Grants (various sources)`);
  console.log(`  - ${Object.keys(templates).length} Review Templates`);
  console.log('  - 1 Active Campaign');
  console.log(`  - ${grants.length} Pending Review Items`);
  console.log('  - 1 Access Request');
  console.log('  - Audit logs for all actions');

  console.log('\nDemo Scenarios:');
  console.log('1. Access Review: alice@company.com has pending reviews');
  console.log('2. Access Request: bob@company.com requesting data warehouse access');
  console.log('3. Delegation: Reviewers can delegate tasks');
  console.log('4. Audit Trail: Complete history of all actions');

  console.log('\nAPI Examples:');
  console.log(`  Campaign: GET /campaigns/${campaign.id}/summary`);
  console.log('  Reviews: GET /reviews?reviewerEmail=alice@company.com');
  console.log('  Requests: GET /access-requests/pending?reviewerId=alice@company.com');
  console.log('  Audit: GET /audit-logs?actor=alice@company.com');
}

seedComprehensive()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
