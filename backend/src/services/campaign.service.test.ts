import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { CampaignService } from './campaign.service';
import { testPrisma, cleanDatabase, disconnectDatabase } from '../test/helpers/db.helper';
import { systemResourceFixtures, principalFixtures } from '../test/fixtures/system-resource.fixture';

describe('CampaignService', () => {
  const campaignService = new CampaignService();

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('createCampaign', () => {
    it('should create a campaign successfully', async () => {
      const request = {
        name: 'Q1 2025 Review',
        periodStart: '2025-01-01T00:00:00Z',
        periodEnd: '2025-03-31T23:59:59Z',
      };

      const campaign = await campaignService.createCampaign(request);

      expect(campaign).toBeTruthy();
      expect(campaign.name).toBe('Q1 2025 Review');
      expect(campaign.status).toBe('DRAFT');
      expect(campaign.id).toBeTruthy();
    });
  });

  describe('generateReviewItems', () => {
    it('should generate review items from access grants', async () => {
      // Setup: create system, principal, and access grant
      const system = await testPrisma.systemResource.create({
        data: systemResourceFixtures.salesforce,
      });

      const principal = await testPrisma.principal.create({
        data: principalFixtures.alice,
      });

      await testPrisma.accessGrant.create({
        data: {
          systemId: system.id,
          principalId: principal.id,
          role: 'Admin',
          grantedAt: new Date('2024-01-01'),
        },
      });

      // Create campaign
      const campaign = await testPrisma.reviewCampaign.create({
        data: {
          name: 'Test Campaign',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2025-12-31'),
          status: 'DRAFT',
        },
      });

      // Generate review items
      const result = await campaignService.generateReviewItems(campaign.id);

      expect(result.itemsGenerated).toBe(1);
      expect(result.campaign.status).toBe('ACTIVE');

      const reviewItems = await testPrisma.reviewItem.findMany({
        where: { campaignId: campaign.id },
      });

      expect(reviewItems).toHaveLength(1);
      expect(reviewItems[0].decision).toBe('PENDING');
    });

    it('should not generate duplicate review items', async () => {
      // Setup
      const system = await testPrisma.systemResource.create({
        data: systemResourceFixtures.github,
      });

      const principal = await testPrisma.principal.create({
        data: principalFixtures.bob,
      });

      const grant = await testPrisma.accessGrant.create({
        data: {
          systemId: system.id,
          principalId: principal.id,
          role: 'Developer',
          grantedAt: new Date('2024-01-01'),
        },
      });

      const campaign = await testPrisma.reviewCampaign.create({
        data: {
          name: 'Test Campaign',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2025-12-31'),
          status: 'DRAFT',
        },
      });

      // First generation
      await campaignService.generateReviewItems(campaign.id);

      // Second generation (should not create duplicates)
      const result = await campaignService.generateReviewItems(campaign.id);

      expect(result.itemsGenerated).toBe(0);

      const reviewItems = await testPrisma.reviewItem.findMany({
        where: { campaignId: campaign.id },
      });

      expect(reviewItems).toHaveLength(1);
    });

    it('should throw error for non-existent campaign', async () => {
      await expect(
        campaignService.generateReviewItems('non-existent-id')
      ).rejects.toThrow('Campaign not found');
    });
  });

  describe('getCampaignSummary', () => {
    it('should return campaign statistics', async () => {
      // Setup
      const system = await testPrisma.systemResource.create({
        data: systemResourceFixtures.salesforce,
      });

      const principal = await testPrisma.principal.create({
        data: principalFixtures.alice,
      });

      const grant = await testPrisma.accessGrant.create({
        data: {
          systemId: system.id,
          principalId: principal.id,
          role: 'Admin',
          grantedAt: new Date('2024-01-01'),
        },
      });

      const campaign = await testPrisma.reviewCampaign.create({
        data: {
          name: 'Test Campaign',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2025-12-31'),
          status: 'ACTIVE',
        },
      });

      // Create review items with different statuses
      await testPrisma.reviewItem.createMany({
        data: [
          {
            campaignId: campaign.id,
            accessGrantId: grant.id,
            reviewerEmail: 'reviewer@test.com',
            decision: 'PENDING',
          },
        ],
      });

      const summary = await campaignService.getCampaignSummary(campaign.id);

      expect(summary.campaign.id).toBe(campaign.id);
      expect(summary.stats.total).toBe(1);
      expect(summary.stats.pending).toBe(1);
      expect(summary.stats.keep).toBe(0);
      expect(summary.stats.revoke).toBe(0);
    });
  });

  describe('listCampaigns', () => {
    it('should return campaigns ordered by creation date', async () => {
      await testPrisma.reviewCampaign.createMany({
        data: [
          {
            name: 'Old Campaign',
            periodStart: new Date('2023-01-01'),
            periodEnd: new Date('2023-12-31'),
            status: 'COMPLETED',
            createdAt: new Date('2023-01-01'),
          },
          {
            name: 'New Campaign',
            periodStart: new Date('2024-01-01'),
            periodEnd: new Date('2024-12-31'),
            status: 'ACTIVE',
            createdAt: new Date('2024-01-01'),
          },
        ],
      });

      const campaigns = await campaignService.listCampaigns();

      expect(campaigns).toHaveLength(2);
      expect(campaigns[0].name).toBe('New Campaign');
      expect(campaigns[1].name).toBe('Old Campaign');
    });
  });
});
