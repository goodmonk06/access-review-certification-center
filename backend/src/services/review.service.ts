import { prisma } from '../db';
import { UpdateReviewItemRequest } from '../types';

export class ReviewService {
  async getReviewItemsForReviewer(reviewerEmail: string, campaignId?: string) {
    const items = await prisma.reviewItem.findMany({
      where: {
        reviewerEmail,
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        campaign: true,
        accessGrant: {
          include: {
            principal: true,
            system: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items;
  }

  async getReviewItem(itemId: string) {
    const item = await prisma.reviewItem.findUnique({
      where: { id: itemId },
      include: {
        campaign: true,
        accessGrant: {
          include: {
            principal: true,
            system: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error('Review item not found');
    }

    return item;
  }

  async updateReviewDecision(itemId: string, reviewerEmail: string, request: UpdateReviewItemRequest) {
    // Verify the item belongs to this reviewer
    const item = await prisma.reviewItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('Review item not found');
    }

    if (item.reviewerEmail !== reviewerEmail) {
      throw new Error('Unauthorized: You are not the assigned reviewer for this item');
    }

    // Update the decision
    const updated = await prisma.reviewItem.update({
      where: { id: itemId },
      data: {
        decision: request.decision,
        decidedAt: new Date(),
        comment: request.comment,
      },
      include: {
        accessGrant: {
          include: {
            principal: true,
            system: true,
          },
        },
      },
    });

    return updated;
  }

  async getPendingItemsCount(reviewerEmail: string) {
    return prisma.reviewItem.count({
      where: {
        reviewerEmail,
        decision: 'PENDING',
      },
    });
  }
}

export const reviewService = new ReviewService();
