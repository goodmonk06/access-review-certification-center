import { ResourceType } from '@prisma/client';

export const systemResourceFixtures = {
  salesforce: {
    name: 'Salesforce CRM',
    type: 'APP' as ResourceType,
    description: 'Customer relationship management system',
  },
  github: {
    name: 'GitHub Enterprise',
    type: 'APP' as ResourceType,
    description: 'Source code repository',
  },
  dataWarehouse: {
    name: 'Analytics Data Warehouse',
    type: 'DB' as ResourceType,
    description: 'PostgreSQL data warehouse',
  },
  awsProduction: {
    name: 'AWS Production',
    type: 'OTHER' as ResourceType,
    description: 'AWS production environment',
  },
};

export const principalFixtures = {
  alice: {
    externalId: 'alice@company.com',
    name: 'Alice Johnson',
    email: 'alice@company.com',
  },
  bob: {
    externalId: 'bob@company.com',
    name: 'Bob Smith',
    email: 'bob@company.com',
  },
  carol: {
    externalId: 'carol@company.com',
    name: 'Carol Williams',
    email: 'carol@company.com',
  },
};

export const accessGrantFixtures = {
  aliceSalesforce: {
    role: 'Sales Manager',
    grantedAt: new Date('2024-01-15'),
    metaJson: { department: 'Sales', team: 'Enterprise' },
  },
  bobGithub: {
    role: 'Developer',
    grantedAt: new Date('2024-02-01'),
    metaJson: { organization: 'company', teams: ['platform'] },
  },
};
