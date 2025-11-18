import { prisma } from '../db';
import { CreateCampaignRequest, CampaignSummary } from '../types';
import { emailService } from './email.service';

export class CampaignService {
  async createCampaign(request: CreateCampaignRequest) {
    const campaign = await prisma.reviewCampaign.create({
      data: {
        name: request.name,
        periodStart: new Date(request.periodStart),
        periodEnd: new Date(request.periodEnd),
        status: 'DRAFT',
      },
    });

    return campaign;
  }

  async generateReviewItems(campaignId: string) {
    const campaign = await prisma.reviewCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get all access grants created before the campaign period end
    const accessGrants = await prisma.accessGrant.findMany({
      where: {
        grantedAt: {
          lte: campaign.periodEnd,
        },
      },
      include: {
        principal: true,
        system: true,
      },
    });

    const reviewItems = [];
    const reviewerMap = new Map<string, number>();

    for (const grant of accessGrants) {
      // Check if review item already exists
      const existing = await prisma.reviewItem.findUnique({
        where: {
          campaignId_accessGrantId: {
            campaignId: campaign.id,
            accessGrantId: grant.id,
          },
        },
      });

      if (!existing) {
        // In a real system, you'd determine the reviewer based on organizational hierarchy
        // For now, we'll use the principal's email as a placeholder for their manager
        const reviewerEmail = grant.principal.email;

        const item = await prisma.reviewItem.create({
          data: {
            campaignId: campaign.id,
            accessGrantId: grant.id,
            reviewerEmail,
            decision: 'PENDING',
          },
        });

        reviewItems.push(item);

        // Track reviewers for notifications
        reviewerMap.set(reviewerEmail, (reviewerMap.get(reviewerEmail) || 0) + 1);
      }
    }

    // Update campaign status to ACTIVE
    await prisma.reviewCampaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' },
    });

    // Send notifications to reviewers
    for (const [email, count] of reviewerMap.entries()) {
      await emailService.sendReviewNotification(email, campaign.name, count);
    }

    return {
      campaign,
      itemsGenerated: reviewItems.length,
      reviewersNotified: reviewerMap.size,
    };
  }

  async getCampaignSummary(campaignId: string): Promise<CampaignSummary> {
    const campaign = await prisma.reviewCampaign.findUnique({
      where: { id: campaignId },
      include: {
        reviewItems: true,
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const stats = {
      total: campaign.reviewItems.length,
      pending: campaign.reviewItems.filter(item => item.decision === 'PENDING').length,
      keep: campaign.reviewItems.filter(item => item.decision === 'KEEP').length,
      revoke: campaign.reviewItems.filter(item => item.decision === 'REVOKE').length,
    };

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        periodStart: campaign.periodStart,
        periodEnd: campaign.periodEnd,
      },
      stats,
    };
  }

  async listCampaigns() {
    return prisma.reviewCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const campaignService = new CampaignService();
