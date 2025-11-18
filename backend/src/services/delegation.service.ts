import { prisma } from '../db';
import { DelegationStatus } from '@prisma/client';
import { logger } from '../lib/logger';
import { auditService } from './audit.service';
import { NotFoundError, UnauthorizedError } from '../lib/errors';

export interface CreateDelegationData {
  reviewItemId: string;
  delegatorId: string;
  delegateeId: string;
  reason?: string;
  endsAt?: Date;
}

export class DelegationService {
  async createDelegation(data: CreateDelegationData) {
    // Verify review item exists and belongs to delegator
    const reviewItem = await prisma.reviewItem.findUnique({
      where: { id: data.reviewItemId },
    });

    if (!reviewItem) {
      throw new NotFoundError('Review item not found');
    }

    if (reviewItem.reviewerEmail !== (await this.getEmailById(data.delegatorId))) {
      throw new UnauthorizedError('Only the assigned reviewer can delegate');
    }

    // Create delegation
    const delegation = await prisma.delegation.create({
      data: {
        reviewItemId: data.reviewItemId,
        delegatorId: data.delegatorId,
        delegateeId: data.delegateeId,
        reason: data.reason,
        endsAt: data.endsAt,
        status: 'ACTIVE',
      },
      include: {
        reviewItem: {
          include: {
            campaign: true,
            accessGrant: {
              include: {
                system: true,
                principal: true,
              },
            },
          },
        },
        delegator: true,
        delegatee: true,
      },
    });

    // Update review item to show it's delegated
    await prisma.reviewItem.update({
      where: { id: data.reviewItemId },
      data: { delegatedTo: data.delegateeId },
    });

    // Log audit trail
    await auditService.log({
      actor: data.delegatorId,
      action: 'DELEGATION_CREATED',
      target: delegation.id,
      targetType: 'Delegation',
      details: {
        reviewItemId: data.reviewItemId,
        delegateeId: data.delegateeId,
        reason: data.reason,
      },
    });

    logger.info('Delegation created', {
      delegationId: delegation.id,
      delegatorId: data.delegatorId,
      delegateeId: data.delegateeId,
    });

    return delegation;
  }

  async revokeDelegation(delegationId: string, actorId: string) {
    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
      include: { reviewItem: true },
    });

    if (!delegation) {
      throw new NotFoundError('Delegation not found');
    }

    // Only delegator can revoke
    if (delegation.delegatorId !== actorId) {
      throw new UnauthorizedError('Only the delegator can revoke');
    }

    const updated = await prisma.delegation.update({
      where: { id: delegationId },
      data: { status: 'REVOKED' },
    });

    // Clear delegation from review item
    await prisma.reviewItem.update({
      where: { id: delegation.reviewItemId },
      data: { delegatedTo: null },
    });

    await auditService.log({
      actor: actorId,
      action: 'DELEGATION_CREATED', // Could add DELEGATION_REVOKED action
      target: delegationId,
      targetType: 'Delegation',
      details: { status: 'REVOKED' },
    });

    return updated;
  }

  async getDelegationsForUser(userId: string) {
    const email = await this.getEmailById(userId);

    return prisma.delegation.findMany({
      where: {
        OR: [
          { delegatorId: userId },
          { delegateeId: userId },
        ],
        status: 'ACTIVE',
      },
      include: {
        reviewItem: {
          include: {
            campaign: true,
            accessGrant: {
              include: {
                system: true,
                principal: true,
              },
            },
          },
        },
        delegator: true,
        delegatee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async expireOldDelegations() {
    const now = new Date();

    const expired = await prisma.delegation.updateMany({
      where: {
        status: 'ACTIVE',
        endsAt: {
          lte: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    logger.info('Expired old delegations', { count: expired.count });

    return expired.count;
  }

  private async getEmailById(userId: string): Promise<string> {
    const principal = await prisma.principal.findUnique({
      where: { id: userId },
    });
    return principal?.email || userId;
  }
}

export const delegationService = new DelegationService();
